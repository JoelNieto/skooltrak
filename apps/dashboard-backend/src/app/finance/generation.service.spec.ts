import { BadRequestException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { STUDENT_NOT_IN_SCHOOL } from './charges.service';
import { GENERATION_SCOPE_REQUIRED, GenerationService, STUDENT_NOT_ACTIVE, STUDENT_WITHOUT_GROUP } from './generation.service';

/** FR-FIN-001.6 charge generation, against an in-memory stand-in for Prisma. */

const group7 = { name: '7°A', studyPlanId: 'sp-7', studyPlan: { degreeId: 'premedia' } };
const students = [
  { id: 'st-ana', firstName: 'Ana', fatherName: 'Pérez', schoolId: 'SCH1', enrollmentStatus: 'ACTIVE', classGroup: group7 },
  { id: 'st-beto', firstName: 'Beto', fatherName: 'Pérez', schoolId: 'SCH1', enrollmentStatus: 'ACTIVE', classGroup: group7 },
];
const items = {
  matricula: { name: 'Matrícula', amount: 150, schedule: 'ONE_TIME', dueMonth: 2, startMonth: null, endMonth: null, dueDay: 15 },
  mensualidad: { name: 'Mensualidad', amount: 285, schedule: 'MONTHLY', dueMonth: null, startMonth: 3, endMonth: 5, dueDay: 5 },
};
const assignments = [
  { feeItemId: 'matricula', degreeId: 'premedia', studyPlanId: null, amountOverride: null, feeItem: items.matricula },
  { feeItemId: 'mensualidad', degreeId: 'premedia', studyPlanId: null, amountOverride: null, feeItem: items.mensualidad },
  { feeItemId: 'mensualidad', degreeId: null, studyPlanId: 'sp-7', amountOverride: 250, feeItem: items.mensualidad },
];

function setup(o: { existing?: { studentId: string; feeItemId: string; installment: number }[]; student?: unknown } = {}) {
  const created: Record<string, unknown>[] = [];
  const audit: unknown[] = [];
  const keys = new Set((o.existing ?? []).map((e) => `${e.studentId}|${e.feeItemId}|${e.installment}`));
  const tx = {
    charge: {
      createMany: jest.fn().mockImplementation(({ data, skipDuplicates }) => {
        expect(skipDuplicates).toBe(true);
        let count = 0;
        for (const row of data) {
          const key = `${row.studentId}|${row.feeItemId}|${row.installment}`;
          if (keys.has(key)) continue;
          keys.add(key);
          created.push(row);
          count++;
        }
        return Promise.resolve({ count });
      }),
    },
    financeAuditLog: { create: jest.fn().mockImplementation(({ data }) => (audit.push(data), Promise.resolve({}))) },
  };
  const prisma = {
    school: { findUniqueOrThrow: jest.fn().mockResolvedValue({ schoolYearStartMonth: 3, currencyCode: 'USD' }) },
    student: {
      findMany: jest.fn().mockResolvedValue(students),
      findUnique: jest.fn().mockResolvedValue(o.student ?? students[0]),
    },
    studyPlan: { findUnique: jest.fn().mockResolvedValue({ schoolId: 'SCH1' }) },
    classGroup: { findUnique: jest.fn().mockResolvedValue({ schoolId: 'SCH1' }) },
    feeAssignment: { findMany: jest.fn().mockResolvedValue(assignments) },
    feeItem: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'matricula', name: 'Matrícula' },
        { id: 'mensualidad', name: 'Mensualidad' },
      ]),
    },
    charge: { findMany: jest.fn().mockImplementation(() => Promise.resolve([...keys].map((k) => {
      const [studentId, feeItemId, installment] = k.split('|');
      return { studentId, feeItemId, installment: Number(installment) };
    }))) },
    familyAccountStudent: {
      findMany: jest.fn().mockResolvedValue([
        { studentId: 'st-ana', accountId: 'A1' },
        { studentId: 'st-beto', accountId: 'A1' },
      ]),
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
  };
  const accounts = { sync: jest.fn().mockResolvedValue(undefined) };
  const service = new GenerationService(prisma as never, accounts as never);
  return { service, prisma, created, audit, accounts };
}

const admin = { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' } as never;
const planScope = { schoolId: 'SCH1', year: 2027, studyPlanId: 'sp-7' };

describe('GenerationService (FR-FIN-001.6)', () => {
  it('previews students × items × installments with the plan override', async () => {
    const { service, prisma } = setup();
    const preview = await service.preview(planScope);

    expect(prisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ schoolId: 'SCH1', enrollmentStatus: 'ACTIVE', classGroup: { studyPlanId: 'sp-7' } }) }),
    );
    // Per student: Matrícula 150 + 3 × Mensualidad at the 7° override of 250.
    expect(preview).toMatchObject({ year: 2027, students: 2, newCount: 8, newTotal: 1800, existingCount: 0 });
    expect(preview.items).toEqual([
      { feeItemId: 'matricula', name: 'Matrícula', installments: 1, students: 2, newCount: 2, newTotal: 300 },
      { feeItemId: 'mensualidad', name: 'Mensualidad', installments: 3, students: 2, newCount: 6, newTotal: 1500 },
    ]);
    expect(preview.studentLines[0]).toEqual({ id: 'st-ana', name: 'Ana Pérez', classGroup: '7°A', newCount: 4, newTotal: 900, existingCount: 0 });
  });

  it('creates the charges on the family accounts, with an audit entry', async () => {
    const { service, created, audit, accounts } = setup();
    await expect(service.generate(admin, 'org-1', planScope)).resolves.toEqual({ created: 8, skipped: 0 });

    expect(accounts.sync).toHaveBeenCalledWith('SCH1');
    expect(created).toContainEqual(
      expect.objectContaining({
        organizationId: 'org-1',
        schoolId: 'SCH1',
        accountId: 'A1',
        studentId: 'st-ana',
        year: 2027,
        source: 'FEE',
        feeItemId: 'mensualidad',
        installment: 1,
        description: 'Mensualidad — marzo 2027',
        grossAmount: 250,
        netAmount: 250,
        dueDate: new Date('2027-03-05T00:00:00Z'),
        createdById: 'u-admin',
      }),
    );
    // A March school: February closes the year, so Matrícula is due in the next calendar year.
    expect(created).toContainEqual(expect.objectContaining({ feeItemId: 'matricula', description: 'Matrícula', dueDate: new Date('2028-02-15T00:00:00Z') }));
    expect(audit).toEqual([expect.objectContaining({ action: 'CHARGE_GENERATE', entity: 'StudyPlan', entityId: 'sp-7' })]);
  });

  it('only creates what is missing when run again (BR-FIN-001.5)', async () => {
    const { service, created } = setup({ existing: [{ studentId: 'st-ana', feeItemId: 'mensualidad', installment: 1 }] });
    await expect(service.preview(planScope)).resolves.toMatchObject({ newCount: 7, existingCount: 1, newTotal: 1550 });
    await expect(service.generate(admin, 'org-1', planScope)).resolves.toEqual({ created: 7, skipped: 1 });
    expect(created).toHaveLength(7);

    await expect(service.generate(admin, 'org-1', planScope)).resolves.toEqual({ created: 0, skipped: 8 });
    expect(created).toHaveLength(7);
  });

  it('generates for one student', async () => {
    const { service, prisma } = setup();
    await expect(service.preview({ schoolId: 'SCH1', year: 2027, studentId: 'st-ana' })).resolves.toMatchObject({ students: 1, newCount: 4 });
    expect(prisma.student.findMany).not.toHaveBeenCalled();
  });

  it('refuses a missing or ambiguous scope, and students outside the rules', async () => {
    await expect(setup().service.preview({ schoolId: 'SCH1', year: 2027 })).rejects.toThrow(new BadRequestException(GENERATION_SCOPE_REQUIRED));
    await expect(setup().service.preview({ ...planScope, classGroupId: 'g' })).rejects.toThrow(new BadRequestException(GENERATION_SCOPE_REQUIRED));
    const scope = { schoolId: 'SCH1', year: 2027, studentId: 'st-x' };
    await expect(setup({ student: { ...students[0], schoolId: 'SCH2' } }).service.preview(scope)).rejects.toThrow(
      new BadRequestException(STUDENT_NOT_IN_SCHOOL),
    );
    await expect(setup({ student: { ...students[0], enrollmentStatus: 'RETIRED' } }).service.preview(scope)).rejects.toThrow(
      new BadRequestException(STUDENT_NOT_ACTIVE),
    );
    await expect(setup({ student: { ...students[0], classGroup: null } }).service.preview(scope)).rejects.toThrow(
      new BadRequestException(STUDENT_WITHOUT_GROUP),
    );
  });
});
