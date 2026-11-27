import { ForbiddenException } from '@nestjs/common';

// The `@/auth` barrel pulls in better-auth's ESM build, which this Jest setup can't parse. The
// controller only needs the guards, decorators and Perm enum, so serve those from source.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({
  ...jest.requireActual('../../../../../libs/auth/src/lib/auth.guard'),
  ...jest.requireActual('../../../../../libs/auth/src/lib/permissions/permissions.constants'),
}));
jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { DEFAULT_ROLE_PERMISSIONS, Perm } from '@/auth';
import { SCHOOL_DENIED } from '../org-scope';
import { AccountsService } from './accounts.service';
import { FinanceController } from './finance.controller';
import { ACCOUNT_DENIED, FINANCE_DENIED, isFinanceManager, isFinanceStaff } from './finance-access';

/**
 * Finance routes check the caller's organization, and keep guardians to accounts holding one of
 * their linked children (FIN-001 §2). Runs the real controller and access rules against an
 * in-memory stand-in for the Prisma lookups.
 */

const schools = [
  { id: 'SCH1', organizationId: 'org-1', name: 'Los Robles', currencyCode: 'USD', timezone: 'America/Panama' },
  { id: 'SCH9', organizationId: 'org-2', name: 'Otra', currencyCode: 'USD', timezone: 'America/Panama' },
];

const account = (id: string, schoolId: string, organizationId: string, guardianUserId: string | null) => ({
  id,
  schoolId,
  organizationId,
  number: 1,
  school: schools.find((s) => s.id === schoolId)!,
  students: [
    {
      student: {
        id: `st-${id}`,
        firstName: 'Sofía',
        fatherName: 'González',
        motherName: 'Ríos',
        documentId: '8-1-1',
        classGroup: null,
        parents: guardianUserId
          ? [{ id: 'p1', firstName: 'Ana', fatherName: 'Ríos', documentId: '8-2-2', relationship: 'Madre', userId: guardianUserId }]
          : [],
      },
    },
  ],
});
const accounts = [account('A1', 'SCH1', 'org-1', 'u-parent'), account('A9', 'SCH9', 'org-2', null)];

const prisma = {
  school: { findUnique: async ({ where }: { where: { id: string } }) => schools.find((s) => s.id === where.id) ?? null },
  familyAccount: {
    findUnique: async ({ where }: { where: { id: string } }) => accounts.find((a) => a.id === where.id) ?? null,
  },
  charge: { findMany: async () => [] },
  payment: { findMany: async () => [] },
};

const user = (userId: string, role: string, organizationId: string | null = 'org-1', permissions: string[] = []) =>
  ({ userId, role, organizationId, permissions }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const otherAdmin = user('u-admin9', 'ORG_ADMIN', 'org-2');
const accountant = user('u-acc', 'ACCOUNTANT', 'org-1', [Perm.VIEW_FINANCIALS]);
const manager = user('u-mgr', 'ACCOUNTANT', 'org-1', [Perm.VIEW_FINANCIALS, Perm.MANAGE_FINANCIALS]);
const teacher = user('u-t', 'TEACHER', 'org-1', []);
const parent = user('u-parent', 'PARENT', null, [Perm.VIEW_FINANCIALS]);
const otherParent = user('u-parent2', 'PARENT', null, [Perm.VIEW_FINANCIALS]);

function setup() {
  const accountsService = new AccountsService(prisma as never, { now: () => new Date('2026-11-26T15:00:00Z') });
  jest.spyOn(accountsService, 'sync').mockResolvedValue();
  const list = jest.spyOn(accountsService, 'list').mockResolvedValue({ items: [], total: 0, page: 1, take: 25, currencyCode: 'USD' });
  const charges = {
    createManual: jest.fn().mockResolvedValue({ created: 1, chargeIds: ['c'] }),
    searchStudents: jest.fn().mockResolvedValue([]),
    chargeSchool: jest.fn().mockImplementation(async (id: string) => (id === 'ch-9' ? 'SCH9' : 'SCH1')),
    cancel: jest.fn().mockResolvedValue({}),
  };
  const fees = {
    listItems: jest.fn().mockResolvedValue({ items: [], currencyCode: 'USD' }),
    createItem: jest.fn().mockResolvedValue({}),
    updateItem: jest.fn().mockResolvedValue({}),
    itemSchool: jest.fn().mockImplementation(async (id: string) => (id === 'fee-9' ? 'SCH9' : 'SCH1')),
    createAssignment: jest.fn().mockResolvedValue({}),
  };
  const generation = { preview: jest.fn().mockResolvedValue({}), generate: jest.fn().mockResolvedValue({ created: 0, skipped: 0 }) };
  const payments = {
    accountSchool: jest.fn().mockImplementation(async (id: string) => (id === 'A9' ? 'SCH9' : 'SCH1')),
    register: jest.fn().mockResolvedValue({}),
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, take: 25, currencyCode: 'USD' }),
    receipt: jest.fn().mockResolvedValue({}),
    paymentSchool: jest.fn().mockImplementation(async (id: string) => (id === 'pay-9' ? 'SCH9' : 'SCH1')),
    voidPayment: jest.fn().mockResolvedValue({}),
  };
  const checkouts = { checkout: jest.fn().mockResolvedValue({ status: 'COMPLETED' }) };
  const controller = new FinanceController(
    accountsService,
    charges as never,
    fees as never,
    generation as never,
    payments as never,
    checkouts as never,
    prisma as never,
  );
  return { controller, list, charges, accountsService, fees, generation, payments, checkouts };
}

const req = (u: unknown) => ({ user: u }) as never;
const chargeInput = (schoolId: string) => ({ schoolId, studentId: 'st', description: 'Excursión', amount: 25, dueDate: '2026-12-15' });

describe('finance access (FIN-001-S01)', () => {
  it('treats only staff as finance staff, and only admins or MANAGE_FINANCIALS as managers', () => {
    expect(isFinanceStaff(admin)).toBe(true);
    expect(isFinanceStaff(accountant)).toBe(true);
    expect(isFinanceStaff(parent)).toBe(false);
    expect(isFinanceStaff(teacher)).toBe(false);
    expect(isFinanceManager(accountant)).toBe(false);
    expect(isFinanceManager(manager)).toBe(true);
    expect(isFinanceManager(user('u', 'PARENT', null, [Perm.MANAGE_FINANCIALS]))).toBe(false);
  });

  describe('GET /finance/accounts (FR-FIN-001.2)', () => {
    it('lists accounts for staff of the school', async () => {
      const { controller, list } = setup();
      await controller.listAccounts(req(accountant), 'SCH1', 'gonzález', 'true');
      expect(list).toHaveBeenCalledWith('SCH1', { q: 'gonzález', overdue: true, page: 1, take: undefined });
    });

    it("refuses another organization's school", async () => {
      const { controller, list } = setup();
      await expect(controller.listAccounts(req(admin), 'SCH9')).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      expect(list).not.toHaveBeenCalled();
    });

    it('refuses parents and staff without VIEW_FINANCIALS', async () => {
      const { controller } = setup();
      await expect(controller.listAccounts(req(parent), 'SCH1')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      await expect(controller.listAccounts(req(teacher), 'SCH1')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
    });
  });

  describe('GET /finance/accounts/:id (FR-FIN-001.3, .12)', () => {
    it('serves staff of the organization and the guardians of the account', async () => {
      const { controller } = setup();
      await expect(controller.account(req(admin), 'A1')).resolves.toMatchObject({ number: 'C-0001', name: 'Familia González Ríos' });
      await expect(controller.account(req(parent), 'A1')).resolves.toMatchObject({
        guardians: [{ id: 'p1', name: 'Ana Ríos', relationship: 'Madre' }],
      });
    });

    it('refuses a parent who is not a guardian of the account', async () => {
      const { controller } = setup();
      await expect(controller.account(req(otherParent), 'A1')).rejects.toThrow(new ForbiddenException(ACCOUNT_DENIED));
    });

    it("refuses staff of another organization", async () => {
      const { controller } = setup();
      await expect(controller.account(req(otherAdmin), 'A1')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      await expect(controller.account(req(admin), 'A9')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
    });
  });

  describe('POST /finance/charges (FR-FIN-001.7)', () => {
    it('lets finance managers of the school create charges', async () => {
      const { controller, charges } = setup();
      await controller.createCharge(req(manager), chargeInput('SCH1'));
      expect(charges.createManual).toHaveBeenCalledWith(manager, 'org-1', chargeInput('SCH1'));
    });

    it('refuses staff without MANAGE_FINANCIALS, parents and other organizations', async () => {
      const { controller, charges } = setup();
      await expect(controller.createCharge(req(accountant), chargeInput('SCH1'))).rejects.toThrow(
        new ForbiddenException(FINANCE_DENIED),
      );
      await expect(controller.createCharge(req(parent), chargeInput('SCH1'))).rejects.toThrow(
        new ForbiddenException(FINANCE_DENIED),
      );
      await expect(controller.createCharge(req(admin), chargeInput('SCH9'))).rejects.toThrow(
        new ForbiddenException(SCHOOL_DENIED),
      );
      expect(charges.createManual).not.toHaveBeenCalled();
    });
  });

  describe('fee catalog and generation (FIN-001-S02)', () => {
    const feeInput = (schoolId: string) =>
      ({ schoolId, name: 'Mensualidad', kind: 'TUITION', amount: 120, schedule: 'MONTHLY', startMonth: 3, endMonth: 12, dueDay: 5 }) as never;
    const genInput = (schoolId: string) => ({ schoolId, year: 2027, studyPlanId: 'sp-1' });

    it('lets finance managers of the school manage the catalog and generate', async () => {
      const { controller, fees, generation } = setup();
      await controller.feeItems(req(manager), 'SCH1');
      await controller.createFeeItem(req(admin), feeInput('SCH1'));
      await controller.updateFeeItem(req(manager), 'fee-1', { amount: 130 });
      await controller.createFeeAssignment(req(manager), { feeItemId: 'fee-1', year: 2027, degreeId: 'd-1' });
      await controller.previewGeneration(req(manager), genInput('SCH1'));
      await controller.generateCharges(req(manager), genInput('SCH1'));
      expect(fees.listItems).toHaveBeenCalledWith('SCH1');
      expect(fees.createItem).toHaveBeenCalledWith(admin, 'org-1', feeInput('SCH1'));
      expect(fees.updateItem).toHaveBeenCalledWith(manager, 'org-1', 'fee-1', { amount: 130 });
      expect(fees.createAssignment).toHaveBeenCalledWith(manager, 'org-1', 'SCH1', { feeItemId: 'fee-1', year: 2027, degreeId: 'd-1' });
      expect(generation.preview).toHaveBeenCalledWith(genInput('SCH1'));
      expect(generation.generate).toHaveBeenCalledWith(manager, 'org-1', genInput('SCH1'));
    });

    it('refuses staff without MANAGE_FINANCIALS, parents and teachers', async () => {
      const { controller, fees, generation } = setup();
      for (const u of [accountant, parent, teacher]) {
        await expect(controller.feeItems(req(u), 'SCH1')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
        await expect(controller.createFeeItem(req(u), feeInput('SCH1'))).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
        await expect(controller.previewGeneration(req(u), genInput('SCH1'))).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
        await expect(controller.students(req(u), 'SCH1', 'ana')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      }
      expect(fees.listItems).not.toHaveBeenCalled();
      expect(fees.createItem).not.toHaveBeenCalled();
      expect(generation.preview).not.toHaveBeenCalled();
    });

    it("refuses another organization's school, fee item or generation", async () => {
      const { controller, fees, generation } = setup();
      await expect(controller.feeItems(req(admin), 'SCH9')).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      await expect(controller.createFeeItem(req(admin), feeInput('SCH9'))).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      await expect(controller.updateFeeItem(req(admin), 'fee-9', { amount: 1 })).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      await expect(controller.createFeeAssignment(req(admin), { feeItemId: 'fee-9', year: 2027, degreeId: 'd-9' })).rejects.toThrow(
        new ForbiddenException(SCHOOL_DENIED),
      );
      await expect(controller.generateCharges(req(admin), genInput('SCH9'))).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      await expect(controller.students(req(admin), 'SCH9', 'ana')).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      expect(fees.updateItem).not.toHaveBeenCalled();
      expect(fees.createAssignment).not.toHaveBeenCalled();
      expect(generation.generate).not.toHaveBeenCalled();
    });
  });

  describe('payments (FIN-001-S03)', () => {
    const paymentInput = (accountId: string) =>
      ({ accountId, method: 'BANK_TRANSFER', amount: 150, receivedAt: '2026-11-26', reference: 'TRX-1', allocations: [] }) as never;

    it('lets finance managers register payments and staff list them', async () => {
      const { controller, payments } = setup();
      await controller.registerPayment(req(manager), paymentInput('A1'));
      expect(payments.register).toHaveBeenCalledWith(manager, 'org-1', paymentInput('A1'));
      await controller.listPayments(req(accountant), 'SCH1', 'YAPPY', '2026-11-01', '2026-11-30');
      expect(payments.list).toHaveBeenCalledWith('SCH1', { method: 'YAPPY', from: '2026-11-01', to: '2026-11-30', page: 1, take: undefined });
    });

    it('refuses registering to staff without MANAGE_FINANCIALS, parents and other organizations', async () => {
      const { controller, payments } = setup();
      await expect(controller.registerPayment(req(accountant), paymentInput('A1'))).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      await expect(controller.registerPayment(req(parent), paymentInput('A1'))).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      await expect(controller.registerPayment(req(teacher), paymentInput('A1'))).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      await expect(controller.registerPayment(req(admin), paymentInput('A9'))).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      expect(payments.register).not.toHaveBeenCalled();
    });

    it("refuses the payments list to parents and to another organization's school", async () => {
      const { controller, payments } = setup();
      await expect(controller.listPayments(req(parent), 'SCH1')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      await expect(controller.listPayments(req(admin), 'SCH9')).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      expect(payments.list).not.toHaveBeenCalled();
    });
  });

  describe('checkout (FIN-001-S04)', () => {
    it('needs PAY_FINANCIALS, which parents have and teachers do not', () => {
      expect(Reflect.getMetadata('requiredPermissions', FinanceController.prototype.checkout)).toEqual([Perm.PAY_FINANCIALS]);
      expect(DEFAULT_ROLE_PERMISSIONS.PARENT).toContain(Perm.PAY_FINANCIALS);
      expect(DEFAULT_ROLE_PERMISSIONS.TEACHER).not.toContain(Perm.PAY_FINANCIALS);
      expect(DEFAULT_ROLE_PERMISSIONS.STUDENT).not.toContain(Perm.PAY_FINANCIALS);
    });

    it('hands the caller to the checkout, which checks the guardian', async () => {
      const { controller, checkouts } = setup();
      const body = { accountId: 'A1', idempotencyKey: 'key-12345', lines: [], card: {} } as never;
      await controller.checkout(req(parent), body);
      expect(checkouts.checkout).toHaveBeenCalledWith(parent, body);
    });
  });

  describe('void and cancel (FIN-001-S05)', () => {
    it('lets finance managers void payments and cancel charges of their organization', async () => {
      const { controller, payments, charges } = setup();
      await controller.voidPayment(req(manager), 'pay-1', { reason: 'Duplicado' });
      await controller.cancelCharge(req(admin), 'ch-1', { reason: 'Beca' });
      expect(payments.voidPayment).toHaveBeenCalledWith(manager, 'org-1', 'pay-1', 'Duplicado');
      expect(charges.cancel).toHaveBeenCalledWith(admin, 'org-1', 'ch-1', 'Beca');
    });

    it('refuses staff without MANAGE_FINANCIALS, parents, teachers and other organizations', async () => {
      const { controller, payments, charges } = setup();
      for (const u of [accountant, parent, teacher]) {
        await expect(controller.voidPayment(req(u), 'pay-1', { reason: 'x' })).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
        await expect(controller.cancelCharge(req(u), 'ch-1', { reason: 'x' })).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
      }
      await expect(controller.voidPayment(req(admin), 'pay-9', { reason: 'x' })).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      await expect(controller.cancelCharge(req(admin), 'ch-9', { reason: 'x' })).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
      expect(payments.voidPayment).not.toHaveBeenCalled();
      expect(charges.cancel).not.toHaveBeenCalled();
    });
  });
});
