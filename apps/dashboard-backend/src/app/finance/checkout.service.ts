import { AuthUserContext } from '@/auth';
import { PaymentMethod, PaymentStatus, Prisma } from '@generated/prisma';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK, Clock, schoolLocalTime } from '../home/home-time';
import { PrismaService } from '../prisma.service';
import { fromCents, outstandingCents } from './charge-status';
import { CheckoutError, planCheckout } from './checkout-plan';
import { CheckoutInput } from './dto/checkout.input';
import { CheckoutResult } from './entities/payments.entity';
import { ACCOUNT_DENIED } from './finance-access';
import { PAYMENT_PROVIDER, PaymentProvider } from './payment-provider';
import { PaymentsService } from './payments.service';

export const CARD_EXPIRED = 'La tarjeta está vencida';
export const IDEMPOTENCY_KEY_TAKEN = 'Este intento de pago ya fue usado';

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

/**
 * Family checkout by card (FR-FIN-001.13). One transaction per attempt:
 * 1. the payment row is inserted with the idempotency key (a concurrent retry waits on it, then
 *    gets the first result: BR-FIN-001.13);
 * 2. the school's receipt row, then the charges, are locked (the order offline payments use);
 * 3. the charges are re-checked (BR-FIN-001.11) and the provider is called (BR-FIN-001.12);
 * 4. the payment ends COMPLETED with its allocations and receipt number (BR-FIN-001.16), or
 *    FAILED with nothing allocated and no number.
 * The mock provider answers synchronously; a real one would be called outside the transaction.
 */
@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async checkout(user: AuthUserContext | undefined, input: CheckoutInput): Promise<CheckoutResult> {
    const userId = user?.userId;
    if (!userId) throw new ForbiddenException(ACCOUNT_DENIED);

    const account = await this.prisma.familyAccount.findUnique({
      where: { id: input.accountId },
      select: {
        id: true,
        organizationId: true,
        schoolId: true,
        school: { select: { timezone: true } },
        students: { select: { student: { select: { parents: { select: { userId: true } } } } } },
      },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    // Only the account's guardians pay it, whatever their permissions (BR-FIN-001.11).
    if (!account.students.some((l) => l.student.parents.some((p) => p.userId === userId))) {
      throw new ForbiddenException(ACCOUNT_DENIED);
    }

    const previous = await this.outcomeOf(user, input.idempotencyKey);
    if (previous) return previous;

    const today = schoolLocalTime(this.clock.now(), account.school.timezone).date;
    const expiry = `${input.card.expYear}-${String(input.card.expMonth).padStart(2, '0')}`;
    if (expiry < today.slice(0, 7)) throw new BadRequestException(CARD_EXPIRED);

    const lines = input.lines.map((l) => ({ chargeId: l.chargeId, amount: Math.round(l.amount * 100) }));
    const { schoolId } = account;

    let paymentId: string;
    try {
      paymentId = await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            organizationId: account.organizationId,
            schoolId,
            accountId: account.id,
            method: PaymentMethod.CARD,
            status: PaymentStatus.PENDING,
            amount: 0,
            receivedAt: new Date(`${today}T00:00:00.000Z`),
            cardBrand: input.card.brand,
            cardLast4: input.card.last4,
            provider: this.provider.name,
            idempotencyKey: input.idempotencyKey,
            payerUserId: userId,
            createdById: userId,
          },
          select: { id: true },
        });

        await tx.$executeRaw`INSERT INTO "finance_settings" ("id", "schoolId", "receiptSeq", "updatedAt")
          VALUES (${`fs_${schoolId}`}, ${schoolId}, 0, now()) ON CONFLICT ("schoolId") DO NOTHING`;
        await tx.$queryRaw`SELECT "id" FROM "finance_settings" WHERE "schoolId" = ${schoolId} FOR UPDATE`;
        const chargeIds = [...new Set(lines.map((l) => l.chargeId))];
        await tx.$queryRaw`SELECT "id" FROM "charges" WHERE "id" IN (${Prisma.join(chargeIds)}) FOR UPDATE`;
        const charges = await tx.charge.findMany({
          where: { id: { in: chargeIds } },
          select: { id: true, accountId: true, netAmount: true, paidAmount: true, dueDate: true, cancelledAt: true },
        });

        let total: number;
        try {
          total = planCheckout(
            account.id,
            lines,
            charges.map((c) => ({ id: c.id, accountId: c.accountId, outstanding: outstandingCents(c), cancelled: !!c.cancelledAt })),
          );
        } catch (e) {
          if (!(e instanceof CheckoutError)) throw e;
          if (e.kind === 'forbidden') throw new ForbiddenException(e.message);
          if (e.kind === 'conflict') throw new ConflictException(e.message);
          throw new BadRequestException(e.message);
        }

        const result = await this.provider.charge({ amount: total, card: input.card, idempotencyKey: input.idempotencyKey });
        const audit = (action: string, payload: Prisma.InputJsonValue) =>
          tx.financeAuditLog.create({
            data: { organizationId: account.organizationId, schoolId, actorId: userId, action, entity: 'Payment', entityId: payment.id, payload },
          });

        if ('message' in result) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.FAILED, amount: fromCents(total), note: result.message },
          });
          await audit('PAYMENT_DECLINED', { accountId: account.id, amount: fromCents(total), message: result.message, last4: input.card.last4 });
          return payment.id;
        }

        const [{ receiptSeq }] = await tx.$queryRaw<{ receiptSeq: number }[]>`UPDATE "finance_settings"
          SET "receiptSeq" = "receiptSeq" + 1, "updatedAt" = now() WHERE "schoolId" = ${schoolId} RETURNING "receiptSeq"`;
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            amount: fromCents(total),
            providerRef: result.providerRef,
            reference: result.providerRef,
            receiptNumber: receiptSeq,
            allocations: { create: lines.map((l) => ({ chargeId: l.chargeId, amount: fromCents(l.amount) })) },
          },
        });
        for (const l of lines) {
          await tx.charge.update({ where: { id: l.chargeId }, data: { paidAmount: { increment: fromCents(l.amount) } } });
        }
        await audit('PAYMENT_CREATE', {
          accountId: account.id,
          method: PaymentMethod.CARD,
          amount: fromCents(total),
          receiptNumber: receiptSeq,
          providerRef: result.providerRef,
          allocations: lines.map((l) => ({ chargeId: l.chargeId, amount: fromCents(l.amount) })),
        });
        return payment.id;
      });
    } catch (e) {
      // A concurrent retry with the same key: the first attempt has committed by now.
      if (isUniqueViolation(e)) {
        const first = await this.outcomeOf(user, input.idempotencyKey);
        if (first) return first;
      }
      throw e;
    }
    return this.outcomeOfPayment(user, paymentId);
  }

  /** The result of an earlier attempt with this key, or null when there was none. */
  private async outcomeOf(user: AuthUserContext | undefined, idempotencyKey: string): Promise<CheckoutResult | null> {
    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey }, select: { id: true, payerUserId: true } });
    if (!existing) return null;
    if (existing.payerUserId !== user?.userId) throw new ConflictException(IDEMPOTENCY_KEY_TAKEN);
    return this.outcomeOfPayment(user, existing.id);
  }

  private async outcomeOfPayment(user: AuthUserContext | undefined, paymentId: string): Promise<CheckoutResult> {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, select: { status: true, note: true } });
    if (payment.status === PaymentStatus.FAILED) return { status: 'DECLINED', message: payment.note ?? 'Pago rechazado' };
    return { status: 'COMPLETED', receipt: await this.payments.receipt(user, paymentId) };
  }
}
