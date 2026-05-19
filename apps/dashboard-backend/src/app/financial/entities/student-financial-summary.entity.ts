import { Prisma } from '@generated/prisma';
export class StudentFinancialSummary {
    studentId: string;

    firstName: string;

    fatherName: string;

    totalCharges: Prisma.Decimal;

    totalPayments: Prisma.Decimal;

    balance: Prisma.Decimal;
}
