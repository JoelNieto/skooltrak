import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@generated/prisma';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { ASSIGNMENT_DUPLICATE, ASSIGNMENT_TARGET_REQUIRED, FEE_INACTIVE, FEE_LOCKED, FEE_NAME_TAKEN, FeesService, TARGET_NOT_IN_SCHOOL } from './fees.service';

/** FR-FIN-001.4 / .5 fee catalog and assignments, against an in-memory stand-in for Prisma. */

const unique = () => new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });

const itemRow = (o: Partial<Record<string, unknown>> = {}) => ({
  id: 'fee-1',
  schoolId: 'SCH1',
  name: 'Mensualidad',
  kind: 'TUITION',
  amount: new Prisma.Decimal(285),
  schedule: 'MONTHLY',
  dueMonth: null,
  startMonth: 3,
  endMonth: 12,
  dueDay: 5,
  active: true,
  _count: { charges: 0 },
  ...o,
});

function setup(o: { item?: ReturnType<typeof itemRow> | null; createError?: unknown; target?: { schoolId: string } | null } = {}) {
  const audit: unknown[] = [];
  const tx = {
    feeItem: {
      create: jest.fn().mockImplementation(({ data }) => (o.createError ? Promise.reject(o.createError) : Promise.resolve(itemRow({ ...data, amount: new Prisma.Decimal(data.amount) })))),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(itemRow({ ...data }))),
    },
    feeAssignment: {
      create: jest.fn().mockImplementation(() => (o.createError ? Promise.reject(o.createError) : Promise.resolve({ id: 'as-1' }))),
    },
    financeAuditLog: { create: jest.fn().mockImplementation(({ data }) => (audit.push(data), Promise.resolve({}))) },
  };
  const prisma = {
    feeItem: { findUnique: jest.fn().mockResolvedValue(o.item === undefined ? itemRow() : o.item) },
    degree: { findUnique: jest.fn().mockResolvedValue(o.target === undefined ? { schoolId: 'SCH1' } : o.target) },
    studyPlan: { findUnique: jest.fn().mockResolvedValue(o.target === undefined ? { schoolId: 'SCH1' } : o.target) },
    feeAssignment: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'as-1',
          year: 2027,
          amountOverride: new Prisma.Decimal(250),
          feeItem: { id: 'fee-1', name: 'Mensualidad', amount: new Prisma.Decimal(285) },
          degree: null,
          studyPlan: { id: 'sp-7', name: '7°', degreeId: 'premedia', level: 7 },
        },
      ]),
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
  };
  return { service: new FeesService(prisma as never), tx, audit };
}

const admin = { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' } as never;
const monthly = { schoolId: 'SCH1', name: ' Mensualidad ', kind: 'TUITION', amount: 285, schedule: 'MONTHLY', startMonth: 3, endMonth: 12, dueMonth: 7, dueDay: 5 } as never;

describe('FeesService', () => {
  describe('fee items (FR-FIN-001.4)', () => {
    it('creates an item with only the fields of its schedule, and audits it', async () => {
      const { service, tx, audit } = setup();
      const view = await service.createItem(admin, 'org-1', monthly);
      expect(tx.feeItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { schoolId: 'SCH1', name: 'Mensualidad', kind: 'TUITION', amount: 285, schedule: 'MONTHLY', dueMonth: null, startMonth: 3, endMonth: 12, dueDay: 5 },
        }),
      );
      expect(view).toMatchObject({ name: 'Mensualidad', amount: 285, scheduleLabel: 'Mensual · mar–dic · día 5', chargeCount: 0 });
      expect(audit).toEqual([expect.objectContaining({ action: 'FEE_ITEM_CREATE', entity: 'FeeItem' })]);
    });

    it('rejects an incomplete calendar and a duplicate name', async () => {
      await expect(
        setup().service.createItem(admin, 'org-1', { ...(monthly as object), schedule: 'ONE_TIME', dueMonth: undefined } as never),
      ).rejects.toThrow(new BadRequestException('Indica el mes de vencimiento'));
      await expect(setup({ createError: unique() }).service.createItem(admin, 'org-1', monthly)).rejects.toThrow(
        new ConflictException(FEE_NAME_TAKEN),
      );
    });

    it('changes the amount of an item with charges, but not its calendar (BR-FIN-001.5)', async () => {
      const { service, tx } = setup({ item: itemRow({ _count: { charges: 12 } }) });
      await service.updateItem(admin, 'org-1', 'fee-1', { amount: 300, active: false });
      expect(tx.feeItem.update).toHaveBeenCalledWith(expect.objectContaining({ data: { amount: 300, active: false } }));
      await expect(service.updateItem(admin, 'org-1', 'fee-1', { endMonth: 11 })).rejects.toThrow(new ConflictException(FEE_LOCKED));
      await expect(service.updateItem(admin, 'org-1', 'fee-1', { kind: 'OTHER' })).rejects.toThrow(new ConflictException(FEE_LOCKED));
    });

    it('changes the calendar of an item without charges', async () => {
      const { service, tx } = setup();
      await service.updateItem(admin, 'org-1', 'fee-1', { schedule: 'ONE_TIME', dueMonth: 2 });
      expect(tx.feeItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { schedule: 'ONE_TIME', dueMonth: 2, startMonth: null, endMonth: null, dueDay: 5 } }),
      );
    });
  });

  describe('assignments (FR-FIN-001.5)', () => {
    it('assigns an item to a study plan with an amount override', async () => {
      const { service, tx, audit } = setup();
      const view = await service.createAssignment(admin, 'org-1', 'SCH1', { feeItemId: 'fee-1', year: 2027, studyPlanId: 'sp-7', amountOverride: 250 });
      expect(tx.feeAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { feeItemId: 'fee-1', year: 2027, degreeId: null, studyPlanId: 'sp-7', amountOverride: 250 } }),
      );
      expect(view).toEqual({
        id: 'as-1',
        year: 2027,
        feeItem: { id: 'fee-1', name: 'Mensualidad' },
        degree: null,
        studyPlan: { id: 'sp-7', name: '7°', degreeId: 'premedia' },
        amountOverride: 250,
        amount: 250,
      });
      expect(audit).toEqual([expect.objectContaining({ action: 'FEE_ASSIGNMENT_CREATE' })]);
    });

    it('needs exactly one target in the school and an active item', async () => {
      const input = { feeItemId: 'fee-1', year: 2027 };
      await expect(setup().service.createAssignment(admin, 'org-1', 'SCH1', input)).rejects.toThrow(new BadRequestException(ASSIGNMENT_TARGET_REQUIRED));
      await expect(setup().service.createAssignment(admin, 'org-1', 'SCH1', { ...input, degreeId: 'd', studyPlanId: 'sp' })).rejects.toThrow(
        new BadRequestException(ASSIGNMENT_TARGET_REQUIRED),
      );
      await expect(setup({ target: { schoolId: 'SCH2' } }).service.createAssignment(admin, 'org-1', 'SCH1', { ...input, degreeId: 'd' })).rejects.toThrow(
        new BadRequestException(TARGET_NOT_IN_SCHOOL),
      );
      await expect(
        setup({ item: itemRow({ active: false }) }).service.createAssignment(admin, 'org-1', 'SCH1', { ...input, degreeId: 'd' }),
      ).rejects.toThrow(new BadRequestException(FEE_INACTIVE));
    });

    it('refuses a second assignment of the item to the same target and year (BR-FIN-001.4)', async () => {
      await expect(
        setup({ createError: unique() }).service.createAssignment(admin, 'org-1', 'SCH1', { feeItemId: 'fee-1', year: 2027, studyPlanId: 'sp-7' }),
      ).rejects.toThrow(new ConflictException(ASSIGNMENT_DUPLICATE));
    });
  });
});
