import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma';
import { PrismaService } from '../prisma.service';
import { CreatePaymentInput } from './dto/create-payment.input';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePaymentInput) {
    return this.prisma.payment.create({
      data: {
        studentId: input.studentId,
        amount: input.amount,
        paidAt: input.paidAt,
        reference: input.reference ?? undefined,
        createdBy: input.createdBy ?? undefined,
      },
      include: { student: true },
    });
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

  /** Returns financial summaries for all students linked to the parent of the given userId. */
  async getLinkedStudentsFinancialSummary(userId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: { students: true },
    });

    if (!parent || parent.students.length === 0) {
      return [];
    }

    const summaries = await Promise.all(
      parent.students.map(async (student) => {
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
