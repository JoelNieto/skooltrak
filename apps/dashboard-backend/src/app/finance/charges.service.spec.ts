import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import {
  CANCEL_REASON_REQUIRED,
  CHARGE_ALREADY_CANCELLED,
  CHARGE_HAS_PAYMENTS,
  ChargesService,
  CHARGE_TARGET_REQUIRED,
  GROUP_EMPTY,
  STUDENT_NOT_IN_SCHOOL,
} from './charges.service';

/** FR-FIN-001.7 manual charges, against an in-memory stand-in for Prisma. */
function setup(o: { students?: { id: string }[] } = {}) {
  const created: unknown[] = [];
  const audit: unknown[] = [];
  const tx = {
    charge: {
      create: jest.fn().mockImplementation(({ data }) => {
        created.push(data);
        return Promise.resolve({ id: `ch-${created.length}` });
      }),
    },
    financeAuditLog: { create: jest.fn().mockImplementation(({ data }) => (audit.push(data), Promise.resolve({}))) },
  };
  const prisma = {
    student: {
      findUnique: jest.fn().mockImplementation(({ where }) =>
        Promise.resolve(where.id === 'st-other' ? { schoolId: 'SCH2' } : where.id === 'st-1' ? { schoolId: 'SCH1' } : null),
      ),
      findMany: jest.fn().mockResolvedValue(o.students ?? [{ id: 'st-1' }, { id: 'st-2' }]),
    },
    classGroup: { findUnique: jest.fn().mockResolvedValue({ schoolId: 'SCH1' }) },
    familyAccountStudent: {
      findMany: jest.fn().mockResolvedValue([
        { studentId: 'st-1', accountId: 'A1' },
        { studentId: 'st-2', accountId: 'A2' },
      ]),
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
  };
  const accounts = { sync: jest.fn().mockResolvedValue(undefined) };
  const service = new ChargesService(prisma as never, accounts as never);
  return { service, created, audit, accounts };
}

const admin = { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' } as never;
const base = { schoolId: 'SCH1', description: ' Excursión ', amount: 25, dueDate: '2026-12-15' };

describe('ChargesService.createManual (FR-FIN-001.7)', () => {
  it("puts a student's charge on their family account, with an audit entry", async () => {
    const { service, created, audit, accounts } = setup();
    const result = await service.createManual(admin, 'org-1', { ...base, studentId: 'st-1' });

    expect(accounts.sync).toHaveBeenCalledWith('SCH1');
    expect(result).toEqual({ created: 1, chargeIds: ['ch-1'] });
    expect(created).toEqual([
      expect.objectContaining({
        organizationId: 'org-1',
        schoolId: 'SCH1',
        accountId: 'A1',
        studentId: 'st-1',
        year: 2026,
        source: 'MANUAL',
        description: 'Excursión',
        grossAmount: 25,
        netAmount: 25,
        dueDate: new Date('2026-12-15T00:00:00Z'),
        createdById: 'u-admin',
      }),
    ]);
    expect(audit).toEqual([expect.objectContaining({ action: 'CHARGE_CREATE_MANUAL', entity: 'Student', entityId: 'st-1' })]);
  });

  it('creates one charge per active student of a class group', async () => {
    const { service, created } = setup();
    const result = await service.createManual(admin, 'org-1', { ...base, classGroupId: 'g1' });
    expect(result.created).toBe(2);
    expect(created.map((c) => (c as { accountId: string }).accountId)).toEqual(['A1', 'A2']);
  });

  it('needs exactly one target', async () => {
    const { service } = setup();
    await expect(service.createManual(admin, 'org-1', base)).rejects.toThrow(new BadRequestException(CHARGE_TARGET_REQUIRED));
    await expect(service.createManual(admin, 'org-1', { ...base, studentId: 'st-1', classGroupId: 'g1' })).rejects.toThrow(
      new BadRequestException(CHARGE_TARGET_REQUIRED),
    );
  });

  it("refuses a student of another school, an empty group and a bad date", async () => {
    const { service } = setup({ students: [] });
    await expect(service.createManual(admin, 'org-1', { ...base, studentId: 'st-other' })).rejects.toThrow(
      new BadRequestException(STUDENT_NOT_IN_SCHOOL),
    );
    await expect(service.createManual(admin, 'org-1', { ...base, classGroupId: 'g1' })).rejects.toThrow(
      new BadRequestException(GROUP_EMPTY),
    );
    await expect(service.createManual(admin, 'org-1', { ...base, studentId: 'st-1', dueDate: '2026-02-30' })).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('ChargesService.searchStudents (FIN-001-S02 pickers)', () => {
  it('matches every word against names and cédula, active students of the school only', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'st-1', firstName: 'Carla', fatherName: 'E2E', classGroup: { id: 'g', name: '7°A' } }]);
    const service = new ChargesService({ student: { findMany } } as never, {} as never);

    await expect(service.searchStudents('SCH1', ' carla  e2e ')).resolves.toEqual([{ id: 'st-1', name: 'Carla E2E', classGroup: { id: 'g', name: '7°A' } }]);
    const { where, take } = findMany.mock.calls[0][0];
    expect(where).toMatchObject({ schoolId: 'SCH1', enrollmentStatus: 'ACTIVE' });
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0].OR).toContainEqual({ documentId: { contains: 'carla', mode: 'insensitive' } });
    expect(take).toBe(10);
    await expect(service.searchStudents('SCH1', '   ')).resolves.toEqual([]);
  });
});

describe('ChargesService.cancel (FR-FIN-001.8)', () => {
  function cancelSetup(o: { cancelledAt?: Date | null; activeAllocations?: number; organizationId?: string } = {}) {
    const writes: { op: string; args: { where?: unknown; data?: unknown } }[] = [];
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      charge: {
        findUnique: jest.fn().mockResolvedValue({
          organizationId: o.organizationId ?? 'org-1',
          schoolId: 'SCH1',
          description: 'Matrícula',
          cancelledAt: o.cancelledAt ?? null,
          _count: { allocations: o.activeAllocations ?? 0 },
        }),
        update: jest.fn().mockImplementation((args) => {
          writes.push({ op: 'charge.update', args });
          return Promise.resolve({ id: 'ch-1', cancelledAt: args.data.cancelledAt, cancelReason: args.data.cancelReason });
        }),
      },
      financeAuditLog: { create: jest.fn().mockImplementation((args) => (writes.push({ op: 'audit', args }), Promise.resolve({}))) },
    };
    const prisma = { $transaction: jest.fn().mockImplementation((fn) => fn(tx)) };
    return { service: new ChargesService(prisma as never, {} as never), tx, writes };
  }

  it('cancels a charge with no payment applied, keeping the reason, under a row lock', async () => {
    const { service, tx, writes } = cancelSetup();
    const result = await service.cancel(admin, 'org-1', 'ch-1', ' Beca acordada ');
    expect((tx.$queryRaw.mock.calls[0][0] as TemplateStringsArray).join('?')).toContain('FOR UPDATE');
    expect(tx.charge.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.objectContaining({ _count: { select: { allocations: { where: { reversedAt: null } } } } }) }),
    );
    expect(writes[0].args.data).toMatchObject({ cancelledById: 'u-admin', cancelReason: 'Beca acordada' });
    expect(writes[1].args).toMatchObject({ data: { action: 'CHARGE_CANCEL', entityId: 'ch-1' } });
    expect(result).toMatchObject({ id: 'ch-1', cancelReason: 'Beca acordada' });
  });

  it('refuses while a payment is applied (BR-FIN-001.6), twice, without a reason or across organizations', async () => {
    await expect(cancelSetup({ activeAllocations: 1 }).service.cancel(admin, 'org-1', 'ch-1', 'x')).rejects.toThrow(
      new ConflictException(CHARGE_HAS_PAYMENTS),
    );
    await expect(cancelSetup({ cancelledAt: new Date() }).service.cancel(admin, 'org-1', 'ch-1', 'x')).rejects.toThrow(
      new ConflictException(CHARGE_ALREADY_CANCELLED),
    );
    await expect(cancelSetup().service.cancel(admin, 'org-1', 'ch-1', ' ')).rejects.toThrow(new BadRequestException(CANCEL_REASON_REQUIRED));
    await expect(cancelSetup({ organizationId: 'org-2' }).service.cancel(admin, 'org-1', 'ch-1', 'x')).rejects.toThrow(NotFoundException);
  });
});
