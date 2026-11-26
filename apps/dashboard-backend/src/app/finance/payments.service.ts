import { AuthUserContext } from '@/auth';
import { PaymentMethod, PaymentStatus, Prisma } from '@generated/prisma';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK, Clock, schoolLocalTime } from '../home/home-time';
import { PrismaService } from '../prisma.service';
import { accountNumber, cents, fromCents, outstandingCents } from './charge-status';
import { RegisterPaymentInput } from './dto/payments.input';
import { FinancePaymentList, FinancePaymentSummary, PaymentReceipt } from './entities/payments.entity';
import { ACCOUNT_DENIED, FINANCE_DENIED, isFinanceStaff } from './finance-access';
import { AllocationError, planAllocation, receiptNumber } from './payment-allocation';

export const REFERENCE_TAKEN = 'Referencia ya registrada';
export const REFERENCE_REQUIRED = 'La referencia es obligatoria';
export const RECEIVED_AT_FUTURE = 'La fecha de recepción no puede ser futura';
export const RECEIVED_AT_INVALID = 'La fecha de recepción no es válida';

const PAGE_SIZE = 25;

const ACCOUNT_NAME_SELECT = {
  id: true,
  number: true,
  students: {
    orderBy: { createdAt: 'asc' },
    take: 1,
    select: { student: { select: { fatherName: true, motherName: true } } },
  },
} as const satisfies Prisma.FamilyAccountSelect;

type AccountNameRow = Prisma.FamilyAccountGetPayload<{ select: typeof ACCOUNT_NAME_SELECT }>;

const SUMMARY_SELECT = {
  id: true,
  receiptNumber: true,
  method: true,
  status: true,
  amount: true,
  receivedAt: true,
  reference: true,
  creditEntries: { where: { amount: { gt: 0 } }, select: { amount: true } },
  account: { select: ACCOUNT_NAME_SELECT },
} as const satisfies Prisma.PaymentSelect;

type SummaryRow = Prisma.PaymentGetPayload<{ select: typeof SUMMARY_SELECT }>;

/** "Familia González Ríos" from the account's first student, like the accounts list. */
export function familyName(account: AccountNameRow): string {
  const first = account.students[0]?.student;
  return first ? `Familia ${[first.fatherName, first.motherName].filter(Boolean).join(' ')}` : accountNumber(account.number);
}

function toSummary(row: SummaryRow): FinancePaymentSummary {
  return {
    id: row.id,
    receiptNumber: row.receiptNumber == null ? null : receiptNumber(row.receiptNumber),
    method: row.method,
    status: row.status,
    amount: fromCents(cents(row.amount)),
    receivedAt: row.receivedAt.toISOString().slice(0, 10),
    reference: row.reference,
    creditAmount: fromCents(row.creditEntries.reduce((sum, c) => sum + cents(c.amount), 0)),
    account: { id: row.account.id, number: accountNumber(row.account.number), name: familyName(row.account) },
  };
}

/**
 * Offline payments and receipts (FR-FIN-001.14, .15). A payment, its allocations, the charges'
 * paid amounts, the saldo a favor it creates and its receipt number are written in one transaction:
 * the school's receipt sequence row and the allocated charges are locked first, so payments of a
 * school are serialized, numbers have no gaps (BR-FIN-001.16) and a charge can't be overpaid.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** The account's school, for the controller's access check (404 when it doesn't exist). */
  async accountSchool(accountId: string): Promise<string> {
    const account = await this.prisma.familyAccount.findUnique({ where: { id: accountId }, select: { schoolId: true } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    return account.schoolId;
  }

  /** FR-FIN-001.14. The caller must already be a finance manager of the account's school. */
  async register(user: AuthUserContext | undefined, organizationId: string, input: RegisterPaymentInput): Promise<PaymentReceipt> {
    const account = await this.prisma.familyAccount.findUnique({
      where: { id: input.accountId },
      select: { id: true, schoolId: true, organizationId: true, school: { select: { timezone: true } } },
    });
    if (!account || account.organizationId !== organizationId) throw new NotFoundException('Cuenta no encontrada');

    const reference = input.reference.trim();
    if (!reference) throw new BadRequestException(REFERENCE_REQUIRED);
    const receivedAt = new Date(`${input.receivedAt}T00:00:00.000Z`);
    if (Number.isNaN(receivedAt.getTime()) || receivedAt.toISOString().slice(0, 10) !== input.receivedAt) {
      throw new BadRequestException(RECEIVED_AT_INVALID);
    }
    const today = schoolLocalTime(this.clock.now(), account.school.timezone).date;
    if (input.receivedAt > today) throw new BadRequestException(RECEIVED_AT_FUTURE);
    const amount = Math.round(input.amount * 100);
    if (!(amount > 0)) throw new BadRequestException('El monto debe ser mayor que cero');
    const requests = input.allocations.map((a) => ({ chargeId: a.chargeId, amount: Math.round(a.amount * 100) }));
    const method = input.method as PaymentMethod;
    const { schoolId } = account;

    const paymentId = await this.prisma.$transaction(async (tx) => {
      // The receipt sequence row is the school's payment lock (BR-FIN-001.14, .16).
      await tx.$executeRaw`INSERT INTO "finance_settings" ("id", "schoolId", "receiptSeq", "updatedAt")
        VALUES (${`fs_${schoolId}`}, ${schoolId}, 0, now()) ON CONFLICT ("schoolId") DO NOTHING`;
      const [{ receiptSeq }] = await tx.$queryRaw<{ receiptSeq: number }[]>`UPDATE "finance_settings"
        SET "receiptSeq" = "receiptSeq" + 1, "updatedAt" = now() WHERE "schoolId" = ${schoolId} RETURNING "receiptSeq"`;

      const taken = await tx.payment.findFirst({
        where: { schoolId, method, reference: { equals: reference, mode: 'insensitive' }, status: { not: PaymentStatus.VOIDED } },
        select: { id: true },
      });
      if (taken) throw new ConflictException(REFERENCE_TAKEN);

      const chargeIds = requests.map((r) => r.chargeId);
      if (chargeIds.length) {
        await tx.$queryRaw`SELECT "id" FROM "charges" WHERE "id" IN (${Prisma.join(chargeIds)}) FOR UPDATE`;
      }
      const charges = chargeIds.length
        ? await tx.charge.findMany({
            where: { id: { in: chargeIds } },
            select: { id: true, accountId: true, netAmount: true, paidAmount: true, dueDate: true, cancelledAt: true },
          })
        : [];
      let plan;
      try {
        plan = planAllocation(
          amount,
          account.id,
          requests,
          charges.map((c) => ({ id: c.id, accountId: c.accountId, outstanding: outstandingCents(c), cancelled: !!c.cancelledAt })),
        );
      } catch (e) {
        if (e instanceof AllocationError) throw new BadRequestException(e.message);
        throw e;
      }

      const payment = await tx.payment.create({
        data: {
          organizationId,
          schoolId,
          accountId: account.id,
          method,
          status: PaymentStatus.COMPLETED,
          amount: fromCents(amount),
          receivedAt,
          reference,
          note: input.note?.trim() || null,
          receiptNumber: receiptSeq,
          createdById: user?.userId ?? null,
          allocations: { create: plan.allocations.map((a) => ({ chargeId: a.chargeId, amount: fromCents(a.amount) })) },
        },
        select: { id: true },
      });
      for (const a of plan.allocations) {
        await tx.charge.update({ where: { id: a.chargeId }, data: { paidAmount: { increment: fromCents(a.amount) } } });
      }
      if (plan.credit > 0) {
        await tx.creditEntry.create({
          data: {
            accountId: account.id,
            paymentId: payment.id,
            amount: fromCents(plan.credit),
            reason: 'Saldo a favor del pago',
            createdById: user?.userId ?? null,
          },
        });
        await tx.familyAccount.update({ where: { id: account.id }, data: { creditBalance: { increment: fromCents(plan.credit) } } });
      }
      await tx.financeAuditLog.create({
        data: {
          organizationId,
          schoolId,
          actorId: user?.userId ?? null,
          action: 'PAYMENT_CREATE',
          entity: 'Payment',
          entityId: payment.id,
          payload: {
            accountId: account.id,
            method,
            amount: fromCents(amount),
            reference,
            receiptNumber: receiptSeq,
            allocations: plan.allocations.map((a) => ({ chargeId: a.chargeId, amount: fromCents(a.amount) })),
            credit: fromCents(plan.credit),
          },
        },
      });
      return payment.id;
    });
    return this.receipt(user, paymentId);
  }

  /** FR-FIN-001.15: finance staff of the payment's organization, or a guardian of its account. */
  async receipt(user: AuthUserContext | undefined, paymentId: string): Promise<PaymentReceipt> {
    const row = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        ...SUMMARY_SELECT,
        organizationId: true,
        note: true,
        cardBrand: true,
        cardLast4: true,
        createdAt: true,
        createdById: true,
        voidedAt: true,
        voidReason: true,
        school: { select: { id: true, name: true, logo: true, currencyCode: true } },
        account: {
          select: {
            ...ACCOUNT_NAME_SELECT,
            students: {
              orderBy: { createdAt: 'asc' },
              select: {
                student: {
                  select: {
                    fatherName: true,
                    motherName: true,
                    parents: { select: { id: true, firstName: true, fatherName: true, userId: true } },
                  },
                },
              },
            },
          },
        },
        allocations: {
          where: { reversedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            amount: true,
            charge: { select: { id: true, description: true, dueDate: true, student: { select: { firstName: true, fatherName: true } } } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Pago no encontrado');
    const guardians = new Map<string, { name: string; userId: string | null }>();
    for (const l of row.account.students)
      for (const p of l.student.parents) guardians.set(p.id, { name: `${p.firstName} ${p.fatherName}`.trim(), userId: p.userId });
    if (isFinanceStaff(user)) {
      if (user?.organizationId !== row.organizationId) throw new ForbiddenException(FINANCE_DENIED);
    } else if (!user?.userId || ![...guardians.values()].some((g) => g.userId === user.userId)) {
      throw new ForbiddenException(ACCOUNT_DENIED);
    }

    const createdBy = row.createdById
      ? await this.prisma.user.findUnique({ where: { id: row.createdById }, select: { firstName: true, lastName: true, name: true } })
      : null;
    const lines = [...row.allocations]
      .sort((a, b) => a.charge.dueDate.getTime() - b.charge.dueDate.getTime())
      .map((a) => ({
        chargeId: a.charge.id,
        student: a.charge.student ? `${a.charge.student.firstName} ${a.charge.student.fatherName}`.trim() : null,
        description: a.charge.description,
        amount: fromCents(cents(a.amount)),
      }));
    return {
      ...toSummary(row),
      school: row.school,
      payers: [...guardians.values()].map((g) => g.name),
      note: row.note,
      cardBrand: row.cardBrand,
      cardLast4: row.cardLast4,
      lines,
      createdAt: row.createdAt.toISOString(),
      createdBy: createdBy ? (`${createdBy.firstName ?? ''} ${createdBy.lastName ?? ''}`.trim() || createdBy.name) : null,
      voidedAt: row.voidedAt?.toISOString() ?? null,
      voidReason: row.voidReason,
    };
  }

  /** FR-FIN-001.15 payments list. The caller must already be finance staff of the school. */
  async list(
    schoolId: string,
    filters: { method?: PaymentMethod; from?: string; to?: string; page?: number; take?: number },
  ): Promise<FinancePaymentList> {
    const day = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00.000Z`) : undefined);
    const from = day(filters.from);
    const to = day(filters.to);
    const where: Prisma.PaymentWhereInput = {
      schoolId,
      status: { in: [PaymentStatus.COMPLETED, PaymentStatus.VOIDED] },
      ...(filters.method ? { method: filters.method } : {}),
      ...(from || to ? { receivedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };
    const take = Math.min(Math.max(filters.take ?? PAGE_SIZE, 1), 100);
    const page = Math.max(filters.page ?? 1, 1);
    const [school, rows, total] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { currencyCode: true } }),
      this.prisma.payment.findMany({
        where,
        select: SUMMARY_SELECT,
        orderBy: [{ receivedAt: 'desc' }, { receiptNumber: 'desc' }],
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { items: rows.map(toSummary), total, page, take, currencyCode: school.currencyCode };
  }

}

/** An account's payments, newest first (account detail, Estado de cuenta). */
export async function accountPayments(prisma: PrismaService, accountId: string): Promise<FinancePaymentSummary[]> {
  const rows = await prisma.payment.findMany({
    where: { accountId, status: { in: [PaymentStatus.COMPLETED, PaymentStatus.VOIDED] } },
    select: SUMMARY_SELECT,
    orderBy: [{ receivedAt: 'desc' }, { receiptNumber: 'desc' }],
  });
  return rows.map(toSummary);
}
