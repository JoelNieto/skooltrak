import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@generated/prisma';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { ACCOUNT_DENIED, FINANCE_DENIED } from './finance-access';
import { CHARGE_EXCEEDED } from './payment-allocation';
import { MockCardProvider } from './payment-provider';
import {
  PAYMENT_ALREADY_VOIDED,
  PAYMENT_CREDIT_USED,
  PAYMENT_NOT_COMPLETED,
  PaymentsService,
  RECEIVED_AT_FUTURE,
  REFERENCE_TAKEN,
  VOID_REASON_REQUIRED,
} from './payments.service';

/** FR-FIN-001.14 / .15 offline payments and receipts, against an in-memory stand-in for Prisma. */

const d = (n: number) => new Prisma.Decimal(n);
const clock = { now: () => new Date('2026-11-26T15:00:00Z') };

const receiptRow = {
  id: 'pay-1',
  schoolId: 'SCH1',
  organizationId: 'org-1',
  receiptNumber: 7,
  method: 'BANK_TRANSFER',
  status: 'COMPLETED',
  amount: d(200),
  receivedAt: new Date('2026-11-26T00:00:00Z'),
  reference: 'TRX-1',
  note: null,
  cardBrand: null,
  cardLast4: null,
  createdAt: new Date('2026-11-26T15:00:00Z'),
  createdById: 'u-admin',
  voidedAt: null,
  voidReason: null,
  creditEntries: [{ amount: d(20) }],
  school: { id: 'SCH1', name: 'Los Robles', logo: '', currencyCode: 'USD' },
  account: {
    id: 'A1',
    number: 3,
    students: [
      {
        student: {
          fatherName: 'González',
          motherName: 'Ríos',
          parents: [{ id: 'p1', firstName: 'Ana', fatherName: 'Ríos', userId: 'u-parent' }],
        },
      },
    ],
  },
  allocations: [
    {
      amount: d(30),
      charge: { id: 'marzo', description: 'Mensualidad — marzo 2027', dueDate: new Date('2027-03-05T00:00:00Z'), student: { firstName: 'Sofía', fatherName: 'González' } },
    },
    {
      amount: d(150),
      charge: { id: 'matricula', description: 'Matrícula', dueDate: new Date('2026-11-16T00:00:00Z'), student: { firstName: 'Sofía', fatherName: 'González' } },
    },
  ],
};

function setup(o: { taken?: boolean; account?: unknown } = {}) {
  const writes: { op: string; args: unknown }[] = [];
  const log = (op: string) => jest.fn().mockImplementation((args) => (writes.push({ op, args }), Promise.resolve({ id: 'pay-1' })));
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    $queryRaw: jest.fn().mockImplementation((strings: TemplateStringsArray) =>
      Promise.resolve(strings.join('').includes('RETURNING') ? [{ receiptSeq: 7 }] : []),
    ),
    payment: { findFirst: jest.fn().mockResolvedValue(o.taken ? { id: 'old' } : null), create: log('payment.create') },
    charge: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'matricula', accountId: 'A1', netAmount: d(150), paidAmount: d(0), dueDate: new Date('2026-11-16T00:00:00Z'), cancelledAt: null },
        { id: 'marzo', accountId: 'A1', netAmount: d(285), paidAmount: d(0), dueDate: new Date('2027-03-05T00:00:00Z'), cancelledAt: null },
      ]),
      update: log('charge.update'),
    },
    creditEntry: { create: log('creditEntry.create') },
    familyAccount: { update: log('familyAccount.update') },
    financeAuditLog: { create: log('audit') },
  };
  const prisma = {
    familyAccount: {
      findUnique: jest
        .fn()
        .mockResolvedValue(o.account === undefined ? { id: 'A1', schoolId: 'SCH1', organizationId: 'org-1', school: { timezone: 'America/Panama' } } : o.account),
    },
    payment: { findUnique: jest.fn().mockResolvedValue(receiptRow) },
    user: { findUnique: jest.fn().mockResolvedValue({ firstName: 'Admin', lastName: 'E2E', name: 'Admin E2E' }) },
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
  };
  return { service: new PaymentsService(prisma as never, clock, new MockCardProvider()), tx, writes };
}

const admin = { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' } as never;
const input = {
  accountId: 'A1',
  method: 'BANK_TRANSFER' as const,
  amount: 200,
  receivedAt: '2026-11-26',
  reference: ' TRX-1 ',
  allocations: [
    { chargeId: 'matricula', amount: 150 },
    { chargeId: 'marzo', amount: 30 },
  ],
};

describe('PaymentsService.register (FR-FIN-001.14)', () => {
  it('records the payment, its allocations, the saldo a favor and the receipt number in one transaction', async () => {
    const { service, tx, writes } = setup();
    const receipt = await service.register(admin, 'org-1', input);

    // Locks: the school's receipt sequence, then the allocated charges.
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.$queryRaw.mock.calls.map((c) => (c[0] as TemplateStringsArray).join('?'))).toEqual([
      expect.stringContaining('RETURNING "receiptSeq"'),
      expect.stringContaining('FOR UPDATE'),
    ]);
    expect(tx.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ schoolId: 'SCH1', method: 'BANK_TRANSFER', status: { not: 'VOIDED' } }) }),
    );
    expect(writes.find((w) => w.op === 'payment.create')?.args).toMatchObject({
      data: {
        organizationId: 'org-1',
        schoolId: 'SCH1',
        accountId: 'A1',
        method: 'BANK_TRANSFER',
        status: 'COMPLETED',
        amount: 200,
        reference: 'TRX-1',
        receiptNumber: 7,
        createdById: 'u-admin',
        allocations: { create: [{ chargeId: 'matricula', amount: 150 }, { chargeId: 'marzo', amount: 30 }] },
      },
    });
    expect(writes.filter((w) => w.op === 'charge.update').map((w) => w.args)).toEqual([
      { where: { id: 'matricula' }, data: { paidAmount: { increment: 150 } } },
      { where: { id: 'marzo' }, data: { paidAmount: { increment: 30 } } },
    ]);
    expect(writes.find((w) => w.op === 'creditEntry.create')?.args).toMatchObject({ data: { accountId: 'A1', paymentId: 'pay-1', amount: 20 } });
    expect(writes.find((w) => w.op === 'familyAccount.update')?.args).toEqual({ where: { id: 'A1' }, data: { creditBalance: { increment: 20 } } });
    expect(writes.find((w) => w.op === 'audit')?.args).toMatchObject({ data: { action: 'PAYMENT_CREATE', entityId: 'pay-1' } });

    expect(receipt).toMatchObject({
      receiptNumber: 'R-000007',
      amount: 200,
      creditAmount: 20,
      payers: ['Ana Ríos'],
      createdBy: 'Admin E2E',
      account: { number: 'C-0003', name: 'Familia González Ríos' },
    });
    // Lines oldest-due first.
    expect(receipt.lines.map((l) => l.description)).toEqual(['Matrícula', 'Mensualidad — marzo 2027']);
  });

  it('creates no saldo a favor when fully allocated', async () => {
    const { service, writes } = setup();
    await service.register(admin, 'org-1', { ...input, amount: 180 });
    expect(writes.some((w) => w.op === 'creditEntry.create')).toBe(false);
  });

  it('refuses a reference already used by a non-voided payment of the same method (BR-FIN-001.14)', async () => {
    const { service, writes } = setup({ taken: true });
    await expect(service.register(admin, 'org-1', input)).rejects.toThrow(new ConflictException(REFERENCE_TAKEN));
    expect(writes).toEqual([]);
  });

  it('refuses an allocation over what the charge owes, re-checked under the lock (BR-FIN-001.3)', async () => {
    const { service, writes } = setup();
    await expect(
      service.register(admin, 'org-1', { ...input, amount: 500, allocations: [{ chargeId: 'matricula', amount: 151 }] }),
    ).rejects.toThrow(new BadRequestException(CHARGE_EXCEEDED));
    expect(writes).toEqual([]);
  });

  it('refuses a future date, an empty reference and accounts of other organizations', async () => {
    await expect(setup().service.register(admin, 'org-1', { ...input, receivedAt: '2026-11-27' })).rejects.toThrow(
      new BadRequestException(RECEIVED_AT_FUTURE),
    );
    await expect(setup().service.register(admin, 'org-1', { ...input, reference: '   ' })).rejects.toThrow(BadRequestException);
    await expect(
      setup({ account: { id: 'A9', schoolId: 'SCH9', organizationId: 'org-2', school: { timezone: null } } }).service.register(admin, 'org-1', input),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('PaymentsService.receipt (FR-FIN-001.15)', () => {
  const user = (userId: string, role: string, organizationId: string | null = 'org-1') => ({ userId, role, organizationId, permissions: [] }) as never;

  it("serves staff of the organization and the account's guardians", async () => {
    await expect(setup().service.receipt(admin, 'pay-1')).resolves.toMatchObject({ receiptNumber: 'R-000007' });
    await expect(setup().service.receipt(user('u-parent', 'PARENT', null), 'pay-1')).resolves.toMatchObject({ receiptNumber: 'R-000007' });
  });

  it('refuses other guardians and staff of another organization', async () => {
    await expect(setup().service.receipt(user('u-other', 'PARENT', null), 'pay-1')).rejects.toThrow(new ForbiddenException(ACCOUNT_DENIED));
    await expect(setup().service.receipt(user('u-admin9', 'ORG_ADMIN', 'org-2'), 'pay-1')).rejects.toThrow(new ForbiddenException(FINANCE_DENIED));
  });
});

describe('PaymentsService.voidPayment (FR-FIN-001.16)', () => {
  function voidSetup(o: { status?: string; method?: string; creditBalance?: number; credit?: number } = {}) {
    const writes: { op: string; args: unknown }[] = [];
    const log = (op: string) => jest.fn().mockImplementation((args) => (writes.push({ op, args }), Promise.resolve({})));
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockImplementation((strings: TemplateStringsArray) =>
        Promise.resolve(strings.join('').includes('"family_accounts"') ? [{ creditBalance: d(o.creditBalance ?? 20) }] : []),
      ),
      payment: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          status: o.status ?? 'COMPLETED',
          method: o.method ?? 'BANK_TRANSFER',
          amount: d(200),
          accountId: 'A1',
          providerRef: o.method === 'CARD' ? 'mock_abc' : null,
          receiptNumber: 7,
          allocations: [
            { id: 'al-1', chargeId: 'matricula', amount: d(150) },
            { id: 'al-2', chargeId: 'marzo', amount: d(30) },
          ],
          creditEntries: o.credit === 0 ? [] : [{ amount: d(o.credit ?? 20) }],
        }),
        update: log('payment.update'),
      },
      paymentAllocation: { updateMany: log('allocations.reverse') },
      charge: { update: log('charge.update') },
      creditEntry: { create: log('creditEntry.create') },
      familyAccount: { update: log('familyAccount.update') },
      financeAuditLog: { create: log('audit') },
    };
    const prisma = {
      payment: { findUnique: jest.fn().mockResolvedValue({ ...receiptRow, status: 'VOIDED', voidedById: 'u-admin', voidReason: 'Duplicado', refundRef: null }) },
      user: { findUnique: jest.fn().mockResolvedValue({ firstName: 'Admin', lastName: 'E2E', name: 'Admin E2E' }) },
      $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
    };
    return { service: new PaymentsService(prisma as never, clock, new MockCardProvider()), writes };
  }

  it('reverses the allocations, takes back the saldo a favor and marks the payment VOIDED', async () => {
    const { service, writes } = voidSetup();
    const receipt = await service.voidPayment(admin, 'org-1', 'pay-1', ' Duplicado ');

    expect(writes.find((w) => w.op === 'allocations.reverse')?.args).toEqual({
      where: { id: { in: ['al-1', 'al-2'] } },
      data: { reversedAt: clock.now() },
    });
    expect(writes.filter((w) => w.op === 'charge.update').map((w) => w.args)).toEqual([
      { where: { id: 'matricula' }, data: { paidAmount: { decrement: 150 } } },
      { where: { id: 'marzo' }, data: { paidAmount: { decrement: 30 } } },
    ]);
    expect(writes.find((w) => w.op === 'creditEntry.create')?.args).toMatchObject({
      data: { accountId: 'A1', paymentId: 'pay-1', amount: -20, reason: 'Anulación del pago R-000007' },
    });
    expect(writes.find((w) => w.op === 'familyAccount.update')?.args).toEqual({ where: { id: 'A1' }, data: { creditBalance: { decrement: 20 } } });
    expect(writes.find((w) => w.op === 'payment.update')?.args).toEqual({
      where: { id: 'pay-1' },
      data: { status: 'VOIDED', voidedAt: clock.now(), voidedById: 'u-admin', voidReason: 'Duplicado', refundRef: null },
    });
    expect(writes.find((w) => w.op === 'audit')?.args).toMatchObject({ data: { action: 'PAYMENT_VOID', entityId: 'pay-1' } });
    // The receipt keeps its lines and says who voided it.
    expect(receipt).toMatchObject({ status: 'VOIDED', voidedBy: 'Admin E2E', voidReason: 'Duplicado' });
    expect(receipt.lines).toHaveLength(2);
  });

  it('records a mock refund for card payments', async () => {
    const { service, writes } = voidSetup({ method: 'CARD', credit: 0 });
    await service.voidPayment(admin, 'org-1', 'pay-1', 'Cobro duplicado');
    expect(writes.find((w) => w.op === 'payment.update')?.args).toMatchObject({ data: { refundRef: expect.stringMatching(/^mock_refund_/) } });
    expect(writes.some((w) => w.op === 'creditEntry.create')).toBe(false);
  });

  it('refuses when its saldo a favor was already used (BR-FIN-001.17)', async () => {
    const { service, writes } = voidSetup({ creditBalance: 5, credit: 20 });
    await expect(service.voidPayment(admin, 'org-1', 'pay-1', 'Duplicado')).rejects.toThrow(new ConflictException(PAYMENT_CREDIT_USED));
    expect(writes).toEqual([]);
  });

  it('needs a reason and a completed payment', async () => {
    await expect(voidSetup().service.voidPayment(admin, 'org-1', 'pay-1', '  ')).rejects.toThrow(new BadRequestException(VOID_REASON_REQUIRED));
    await expect(voidSetup({ status: 'VOIDED' }).service.voidPayment(admin, 'org-1', 'pay-1', 'x')).rejects.toThrow(
      new ConflictException(PAYMENT_ALREADY_VOIDED),
    );
    await expect(voidSetup({ status: 'FAILED' }).service.voidPayment(admin, 'org-1', 'pay-1', 'x')).rejects.toThrow(
      new BadRequestException(PAYMENT_NOT_COMPLETED),
    );
    await expect(voidSetup().service.voidPayment(admin, 'org-2', 'pay-1', 'x')).rejects.toThrow(NotFoundException);
  });
});
