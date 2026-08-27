import { Injectable, Logger } from '@nestjs/common';
import { $Enums, Prisma } from '@generated/prisma';
import { PrismaService } from '../prisma.service';
import { CreatePaymentInput } from './dto/create-payment.input';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePaymentInput) {
    const payment = await this.prisma.payment.create({
      data: {
        studentId: input.studentId,
        amount: input.amount,
        paidAt: input.paidAt,
        reference: input.reference ?? undefined,
        createdBy: input.createdBy ?? undefined,
        chargeId: input.chargeId ?? undefined,
      },
      include: { student: true },
    });

    if (input.chargeId) {
      await this.recomputeChargeStatus(input.chargeId);
    }

    return payment;
  }

  /**
   * Recomputes a charge's status from the sum of its payments:
   * fully paid -> PAID, partially paid -> PARTIAL, otherwise PENDING.
   * OVERDUE is derived at read time (dueDate < today), so it is preserved
   * unless the charge is now paid (in which case PAID wins).
   */
  async recomputeChargeStatus(chargeId: string) {
    try {
      const [charge, paymentsAgg] = await Promise.all([
        this.prisma.charge.findUniqueOrThrow({
          where: { id: chargeId },
          select: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: { chargeId },
          _sum: { amount: true },
        }),
      ]);

      const paid = paymentsAgg._sum.amount ?? new Prisma.Decimal(0);
      const amount = charge.amount;
      let status: $Enums.ChargeStatus;
      if (paid.gte(amount)) {
        status = $Enums.ChargeStatus.PAID;
      } else if (paid.gt(0)) {
        status = $Enums.ChargeStatus.PARTIAL;
      } else {
        status = $Enums.ChargeStatus.PENDING;
      }

      await this.prisma.charge.update({
        where: { id: chargeId },
        data: { status },
      });
    } catch (error) {
      this.logger.warn(`Failed to recompute charge status for ${chargeId}:`, error);
    }
  }

  async findByStudent(studentId: string) {
    return this.prisma.payment.findMany({
      where: { studentId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async getStudentBalance(studentId: string) {
    const [chargesAgg, paymentsAgg] = await Promise.all([
      this.prisma.charge.aggregate({
        where: { studentId },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { studentId },
        _sum: { amount: true },
      }),
    ]);

    const totalCharges = chargesAgg._sum.amount ?? new Prisma.Decimal(0);
    const totalPayments = paymentsAgg._sum.amount ?? new Prisma.Decimal(0);
    const balance = (totalCharges as Prisma.Decimal).sub(totalPayments as Prisma.Decimal);

    return {
      studentId,
      totalCharges,
      totalPayments,
      balance,
    };
  }

  /**
   * Balance breakdown for a student: outstanding amounts split into overdue
   * (dueDate < now) and active (dueDate >= now), plus the total paid (all
   * payments, including legacy ones not linked to a charge). Each charge
   * carries its computed status (PAID/PARTIAL/PENDING/OVERDUE) and paid amount.
   */
  async getStudentBalanceSummary(studentId: string) {
    const [charges, payments] = await Promise.all([
      this.prisma.charge.findMany({
        where: { studentId },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { studentId },
        orderBy: { paidAt: 'desc' },
        select: { chargeId: true, amount: true, id: true, paidAt: true, reference: true },
      }),
    ]);

    const paidByCharge = new Map<string, Prisma.Decimal>();
    let totalPayments = new Prisma.Decimal(0);
    for (const p of payments) {
      const amt = p.amount;
      totalPayments = totalPayments.add(amt);
      if (p.chargeId) {
        const prev = paidByCharge.get(p.chargeId) ?? new Prisma.Decimal(0);
        paidByCharge.set(p.chargeId, prev.add(amt));
      }
    }

    const now = new Date();
    let totalCharges = new Prisma.Decimal(0);
    let totalOverdue = new Prisma.Decimal(0);
    let totalActive = new Prisma.Decimal(0);

    const chargeViews = charges.map((charge) => {
      const amount = charge.amount;
      const paidAmount = paidByCharge.get(charge.id) ?? new Prisma.Decimal(0);
      totalCharges = totalCharges.add(amount);

      let status: $Enums.ChargeStatus;
      if (paidAmount.gte(amount)) {
        status = $Enums.ChargeStatus.PAID;
      } else if (paidAmount.gt(0)) {
        status = $Enums.ChargeStatus.PARTIAL;
      } else if (charge.dueDate < now) {
        status = $Enums.ChargeStatus.OVERDUE;
      } else {
        status = $Enums.ChargeStatus.PENDING;
      }

      const outstanding = amount.sub(paidAmount);
      if (charge.dueDate < now) {
        totalOverdue = totalOverdue.add(outstanding);
      } else {
        totalActive = totalActive.add(outstanding);
      }

      return {
        id: charge.id,
        amount: Number(amount),
        paidAmount: Number(paidAmount),
        dueDate: charge.dueDate,
        description: charge.description,
        chargeType: charge.chargeType,
        status,
      };
    });

    const balance = totalCharges.sub(totalPayments);

    return {
      studentId,
      totalCharges: Number(totalCharges),
      totalPayments: Number(totalPayments),
      balance: Number(balance),
      totalOverdue: Number(totalOverdue),
      totalActive: Number(totalActive),
      totalPaid: Number(totalPayments),
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paidAt: p.paidAt.toISOString(),
        reference: p.reference,
      })),
      charges: chargeViews,
    };
  }

  /** Returns financial summaries for all students linked to the parent(s) of the given userId. */
  async getLinkedStudentsFinancialSummary(userId: string) {
    const parents = await this.prisma.parent.findMany({
      where: { userId },
      include: { students: true },
    });

    const students = parents.flatMap((p) => p.students);
    if (students.length === 0) {
      return [];
    }

    const summaries = await Promise.all(
      students.map(async (student) => {
        const balance = await this.getStudentBalance(student.id);
        return {
          studentId: student.id,
          firstName: student.firstName,
          fatherName: student.fatherName,
          totalCharges: balance.totalCharges,
          totalPayments: balance.totalPayments,
          balance: balance.balance,
        };
      }),
    );

    return summaries;
  }
}
