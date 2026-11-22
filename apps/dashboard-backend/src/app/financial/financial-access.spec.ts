import { BadRequestException, ForbiddenException } from '@nestjs/common';

// The `@/auth` barrel pulls in better-auth's ESM build, which this Jest setup can't parse. The
// controller only needs the guards, decorators and Perm enum, so serve those from source.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({
  ...jest.requireActual('../../../../../libs/auth/src/lib/auth.guard'),
  ...jest.requireActual('../../../../../libs/auth/src/lib/permissions/permissions.constants'),
}));
jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../study-plans/study-plans.service', () => ({ StudyPlansService: class {} }));
jest.mock('./charges.service', () => ({ ChargesService: class {} }));
jest.mock('./payments.service', () => ({ PaymentsService: class {} }));

import { Perm } from '@/auth';
import { SCHOOL_DENIED } from '../org-scope';
import {
  CHARGE_MISMATCH,
  FINANCE_DENIED,
  FinancialController,
  isFinanceStaff,
  PLAN_MISMATCH,
  STUDENT_MISMATCH,
} from './financial.controller';

/**
 * Finance routes check the caller's organization, and keep parents and students to their own
 * accounts. Runs the real controller against an in-memory stand-in for the Prisma lookups.
 */

// Org 1: school SCH1, plan P1, student S1 (user u-s1, parent u-parent), charge CH1.
// Org 2: school SCH9, plan P9, student S9, charge CH9.
const schools = [
  { id: 'SCH1', organizationId: 'org-1' },
  { id: 'SCH9', organizationId: 'org-2' },
];
const students = [
  { id: 'S1', organizationId: 'org-1', schoolId: 'SCH1', userId: 'u-s1', parents: [{ userId: 'u-parent' }] },
  { id: 'S9', organizationId: 'org-2', schoolId: 'SCH9', userId: 'u-s9', parents: [] },
];
const plans = [
  { id: 'P1', schoolId: 'SCH1' },
  { id: 'P9', schoolId: 'SCH9' },
];
const charges = [
  { id: 'CH1', schoolId: 'SCH1', studentId: 'S1' },
  { id: 'CH9', schoolId: 'SCH9', studentId: 'S9' },
];

const byId =
  <T extends { id: string }>(rows: T[]) =>
  async ({ where }: { where: { id: string } }) =>
    rows.find((r) => r.id === where.id) ?? null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countWhere = <T extends Record<string, unknown>>(rows: T[]) => async ({ where }: { where: any }) =>
  rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v)).length;

const prisma = {
  school: { findUnique: byId(schools) },
  student: { findUnique: byId(students), count: countWhere(students) },
  studyPlan: { findUnique: byId(plans), count: countWhere(plans) },
  charge: { findUnique: byId(charges), count: countWhere(charges) },
};

const user = (userId: string, role: string, organizationId: string | null = 'org-1', permissions: string[] = []) =>
  ({ user: { userId, role, organizationId, permissions } }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const otherAdmin = user('u-admin9', 'ORG_ADMIN', 'org-2');
const accountant = user('u-acc', 'ACCOUNTANT', 'org-1', [Perm.VIEW_FINANCIALS, Perm.MANAGE_FINANCIALS]);
const parent = user('u-parent', 'PARENT', null, [Perm.VIEW_FINANCIALS]);
const otherParent = user('u-parent2', 'PARENT', null, [Perm.VIEW_FINANCIALS]);
const student = user('u-s1', 'STUDENT', 'org-1', [Perm.VIEW_FINANCIALS]);

function setup() {
  const charges = { findBySchool: jest.fn(), create: jest.fn(), remove: jest.fn(), regenerateFromStudyPlan: jest.fn() };
  const payments = { findBySchool: jest.fn(), findByStudent: jest.fn(), create: jest.fn() };
  const plansService = { updateFinancialConfig: jest.fn() };
  const controller = new FinancialController(charges as never, payments as never, plansService as never, prisma as never);
  return { controller, charges, payments, plansService };
}

describe('Finance access', () => {
  it('finance staff are admins and staff roles with VIEW_FINANCIALS, never parents or students', () => {
    const ctx = (req: unknown) => (req as { user: never }).user;
    expect(isFinanceStaff(ctx(admin))).toBe(true);
    expect(isFinanceStaff(ctx(accountant))).toBe(true);
    expect(isFinanceStaff(ctx(parent))).toBe(false);
    expect(isFinanceStaff(ctx(student))).toBe(false);
    expect(isFinanceStaff(ctx(user('u-t', 'TEACHER')))).toBe(false);
  });

  it("a student's account: its organization's finance staff, the student, and their parents", async () => {
    const { controller, payments } = setup();
    for (const req of [admin, accountant, student, parent]) await controller.getPaymentsByStudent(req, 'S1');
    expect(payments.findByStudent).toHaveBeenCalledTimes(4);
    for (const req of [otherAdmin, otherParent, user('u-s9', 'STUDENT', 'org-1', [Perm.VIEW_FINANCIALS])]) {
      await expect(controller.getPaymentsByStudent(req, 'S1')).rejects.toThrow(ForbiddenException);
    }
    await expect(controller.getPaymentsByStudent(admin, 'S9')).rejects.toThrow(ForbiddenException);
  });

  it('school lists: finance staff of the school only', async () => {
    const { controller, charges, payments } = setup();
    await controller.getChargesBySchool(admin, 'SCH1');
    await controller.getPaymentsBySchool(accountant, 'SCH1');
    expect(charges.findBySchool).toHaveBeenCalledTimes(1);
    expect(payments.findBySchool).toHaveBeenCalledTimes(1);
    await expect(controller.getChargesBySchool(parent, 'SCH1')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
    await expect(controller.getPaymentsBySchool(student, 'SCH1')).rejects.toThrow(ForbiddenException);
    await expect(controller.getChargesBySchool(admin, 'SCH9')).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
  });

  it("writes stay in the caller's organization, and their parts in the same school", async () => {
    const { controller, charges, payments, plansService } = setup();
    const charge = { schoolId: 'SCH1', year: 2026, amount: 10, dueDate: new Date() };

    await controller.createCharge(admin, { ...charge, studentId: 'S1' } as never);
    await controller.createCharge(admin, { ...charge, studyPlanId: 'P1' } as never);
    expect(charges.create).toHaveBeenCalledTimes(2);
    await expect(controller.createCharge(otherAdmin, { ...charge, studentId: 'S1' } as never)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(controller.createCharge(admin, { ...charge, studentId: 'S9' } as never)).rejects.toThrow(
      new BadRequestException(STUDENT_MISMATCH),
    );
    await expect(controller.createCharge(admin, { ...charge, studyPlanId: 'P9' } as never)).rejects.toThrow(
      new BadRequestException(PLAN_MISMATCH),
    );

    await controller.createPayment(admin, { studentId: 'S1', chargeId: 'CH1', createdBy: 'someone-else' } as never);
    expect(payments.create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 'u-admin' }));
    await expect(controller.createPayment(admin, { studentId: 'S9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.createPayment(admin, { studentId: 'S1', chargeId: 'CH9' } as never)).rejects.toThrow(
      new BadRequestException(CHARGE_MISMATCH),
    );
    await expect(controller.createPayment(parent, { studentId: 'S1' } as never)).rejects.toThrow(ForbiddenException);

    await expect(controller.removeCharge(admin, 'CH9')).rejects.toThrow(ForbiddenException);
    await controller.removeCharge(admin, 'CH1');
    expect(charges.remove).toHaveBeenCalledWith('CH1');

    await expect(controller.updateStudyPlanFinancialConfig(admin, { studyPlanId: 'P9' } as never)).rejects.toThrow(
      ForbiddenException,
    );
    await controller.updateStudyPlanFinancialConfig(admin, { studyPlanId: 'P1' } as never);
    expect(plansService.updateFinancialConfig).toHaveBeenCalledTimes(1);

    await expect(controller.regenerateFromStudyPlan(admin, { studentId: 'S9' } as never)).rejects.toThrow(
      ForbiddenException,
    );
    await controller.regenerateFromStudyPlan(admin, { studentId: 'S1' } as never);
    expect(charges.regenerateFromStudyPlan).toHaveBeenCalledWith('S1', false);
  });
});
