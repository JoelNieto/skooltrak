import { BadRequestException, ConflictException, ForbiddenException, ValidationPipe } from '@nestjs/common';
import { Prisma } from '@generated/prisma';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { CARD_EXPIRED, CheckoutService, IDEMPOTENCY_KEY_TAKEN } from './checkout.service';
import { CHECKOUT_ALREADY_PAID, CHECKOUT_FOREIGN_CHARGE } from './checkout-plan';
import { CheckoutInput } from './dto/checkout.input';
import { ACCOUNT_DENIED } from './finance-access';
import { MockCardProvider } from './payment-provider';

/** FR-FIN-001.13 family checkout, against an in-memory stand-in for Prisma. */

const d = (n: number) => new Prisma.Decimal(n);
const clock = { now: () => new Date('2026-11-26T15:00:00Z') };
const parent = { userId: 'u-parent', role: 'PARENT', organizationId: null, permissions: ['PAY_FINANCIALS'] } as never;

function setup(o: { existing?: { id: string; payerUserId: string; status: string; note?: string } | null; paid?: number } = {}) {
  const payments = new Map<string, Record<string, unknown>>();
  if (o.existing) payments.set(o.existing.id, { ...o.existing, idempotencyKey: 'key-12345' });
  const writes: { op: string; args: Record<string, unknown> }[] = [];
  const log = (op: string, result: unknown = {}) =>
    jest.fn().mockImplementation((args) => (writes.push({ op, args }), Promise.resolve(result)));
  const tx = {
    payment: {
      create: jest.fn().mockImplementation(({ data }) => {
        writes.push({ op: 'payment.create', args: data });
        payments.set('pay-new', { id: 'pay-new', ...data });
        return Promise.resolve({ id: 'pay-new' });
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        writes.push({ op: 'payment.update', args: data });
        Object.assign(payments.get(where.id)!, data);
        return Promise.resolve({});
      }),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
    $queryRaw: jest.fn().mockImplementation((strings: TemplateStringsArray) =>
      Promise.resolve(strings.join('').includes('RETURNING') ? [{ receiptSeq: 3 }] : []),
    ),
    charge: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'marzo', accountId: 'A1', netAmount: d(285), paidAmount: d(o.paid ?? 0), dueDate: new Date('2026-11-29T00:00:00Z'), cancelledAt: null },
        { id: 'otra', accountId: 'A9', netAmount: d(150), paidAmount: d(0), dueDate: new Date('2026-11-29T00:00:00Z'), cancelledAt: null },
      ]),
      update: log('charge.update'),
    },
    financeAuditLog: { create: log('audit') },
  };
  const prisma = {
    familyAccount: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'A1',
        organizationId: 'org-1',
        schoolId: 'SCH1',
        school: { timezone: 'America/Panama' },
        students: [{ student: { parents: [{ userId: 'u-parent' }] } }],
      }),
    },
    payment: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = [...payments.values()].find((p) => (where.idempotencyKey ? p.idempotencyKey === where.idempotencyKey : p.id === where.id));
        return Promise.resolve(found ?? null);
      }),
      findUniqueOrThrow: jest.fn().mockImplementation(({ where }) => Promise.resolve(payments.get(where.id))),
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
  };
  const receipts = { receipt: jest.fn().mockImplementation((_u, id) => Promise.resolve({ id, receiptNumber: 'R-000003' })) };
  const provider = new MockCardProvider();
  const charge = jest.spyOn(provider, 'charge');
  const service = new CheckoutService(prisma as never, receipts as never, provider, clock);
  return { service, writes, charge, receipts };
}

const input = (last4 = '4242', lines = [{ chargeId: 'marzo', amount: 100 }]) => ({
  accountId: 'A1',
  idempotencyKey: 'key-12345',
  lines,
  card: { brand: 'visa' as const, last4, expMonth: 12, expYear: 2030 },
});

describe('CheckoutService (FR-FIN-001.13)', () => {
  it('charges the card, allocates the lines and numbers the receipt', async () => {
    const { service, writes, charge } = setup();
    await expect(service.checkout(parent, input())).resolves.toEqual({ status: 'COMPLETED', receipt: { id: 'pay-new', receiptNumber: 'R-000003' } });

    expect(charge).toHaveBeenCalledWith({ amount: 10_000, idempotencyKey: 'key-12345', card: input().card });
    expect(writes[0]).toMatchObject({
      op: 'payment.create',
      args: { method: 'CARD', status: 'PENDING', cardBrand: 'visa', cardLast4: '4242', provider: 'mock', idempotencyKey: 'key-12345', payerUserId: 'u-parent' },
    });
    expect(writes.find((w) => w.op === 'payment.update')?.args).toMatchObject({
      status: 'COMPLETED',
      amount: 100,
      receiptNumber: 3,
      providerRef: expect.stringMatching(/^mock_/),
      allocations: { create: [{ chargeId: 'marzo', amount: 100 }] },
    });
    expect(writes.find((w) => w.op === 'charge.update')?.args).toEqual({ where: { id: 'marzo' }, data: { paidAmount: { increment: 100 } } });
    expect(writes.find((w) => w.op === 'audit')?.args).toMatchObject({ data: { action: 'PAYMENT_CREATE' } });
  });

  it('records a decline with no allocation and no receipt number (BR-FIN-001.12)', async () => {
    const { service, writes } = setup();
    await expect(service.checkout(parent, input('0002'))).resolves.toEqual({ status: 'DECLINED', message: 'Tarjeta rechazada' });
    expect(writes.find((w) => w.op === 'payment.update')?.args).toEqual({ status: 'FAILED', amount: 100, note: 'Tarjeta rechazada' });
    expect(writes.some((w) => w.op === 'charge.update')).toBe(false);
    expect(writes.find((w) => w.op === 'audit')?.args).toMatchObject({ data: { action: 'PAYMENT_DECLINED' } });
  });

  it('returns the first outcome for a repeated idempotency key, without charging again (BR-FIN-001.13)', async () => {
    const done = setup({ existing: { id: 'pay-1', payerUserId: 'u-parent', status: 'COMPLETED' } });
    await expect(done.service.checkout(parent, input())).resolves.toEqual({ status: 'COMPLETED', receipt: { id: 'pay-1', receiptNumber: 'R-000003' } });
    expect(done.charge).not.toHaveBeenCalled();
    expect(done.writes).toEqual([]);

    const declined = setup({ existing: { id: 'pay-2', payerUserId: 'u-parent', status: 'FAILED', note: 'Fondos insuficientes' } });
    await expect(declined.service.checkout(parent, input())).resolves.toEqual({ status: 'DECLINED', message: 'Fondos insuficientes' });

    const other = setup({ existing: { id: 'pay-3', payerUserId: 'u-someone', status: 'COMPLETED' } });
    await expect(other.service.checkout(parent, input())).rejects.toThrow(new ConflictException(IDEMPOTENCY_KEY_TAKEN));
  });

  it('refuses a charge paid meanwhile, another account and an expired card', async () => {
    await expect(setup({ paid: 285 }).service.checkout(parent, input())).rejects.toThrow(new ConflictException(CHECKOUT_ALREADY_PAID));
    await expect(setup().service.checkout(parent, input('4242', [{ chargeId: 'otra', amount: 150 }]))).rejects.toThrow(
      new ForbiddenException(CHECKOUT_FOREIGN_CHARGE),
    );
    await expect(setup().service.checkout(parent, { ...input(), card: { ...input().card, expMonth: 10, expYear: 2026 } })).rejects.toThrow(
      new BadRequestException(CARD_EXPIRED),
    );
  });

  it("refuses anyone who isn't a guardian of the account, admins included", async () => {
    const admin = { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1', permissions: [] } as never;
    await expect(setup().service.checkout(admin, input())).rejects.toThrow(new ForbiddenException(ACCOUNT_DENIED));
  });
});

describe('CheckoutInput (BR-FIN-001.12)', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: CheckoutInput });

  it('accepts brand, last 4 and expiry only: a card number or CVV is refused', async () => {
    await expect(validate(input())).resolves.toBeInstanceOf(CheckoutInput);
    await expect(validate({ ...input(), card: { ...input().card, number: '4242424242424242' } })).rejects.toThrow(BadRequestException);
    await expect(validate({ ...input(), card: { ...input().card, cvv: '123' } })).rejects.toThrow(BadRequestException);
    await expect(validate({ ...input(), card: { ...input().card, last4: '42424' } })).rejects.toThrow(BadRequestException);
  });
});
