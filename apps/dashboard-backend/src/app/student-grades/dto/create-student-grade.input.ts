import { Prisma } from '@generated/prisma';
export class CreateStudentGradeInput
  implements Prisma.StudentGradeUncheckedCreateInput
{
    comments?: string;

    gradeId: string;

    studentId: string;

    score: number | Prisma.Decimal;

    /** Required when the grade is published and the score changes (BR-ASM-001.8, 3–300 characters). */
    reason?: string;
}
