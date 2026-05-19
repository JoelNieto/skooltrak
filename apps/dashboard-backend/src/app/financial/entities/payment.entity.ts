import { Prisma } from '@generated/prisma';
import { Student } from '../../students/entities/student.entity';

export class Payment
  implements Prisma.PaymentGetPayload<{ include: { student: true } }>
{
    id: string;

    studentId: string;

    student: Student;

    amount: Prisma.Decimal;

    paidAt: Date;

    reference: string | null;

    createdBy: string | null;

    createdAt: Date;

    updatedAt: Date;
}
