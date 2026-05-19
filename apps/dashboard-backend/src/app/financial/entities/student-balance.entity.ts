import { Prisma } from '@generated/prisma';
export class StudentBalance {
    studentId: string;

    totalCharges: Prisma.Decimal;

    totalPayments: Prisma.Decimal;

    balance: Prisma.Decimal;
}
