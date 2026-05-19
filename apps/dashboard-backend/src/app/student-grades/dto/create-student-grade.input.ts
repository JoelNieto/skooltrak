import { Prisma } from '@generated/prisma';
export class CreateStudentGradeInput
  implements Prisma.StudentGradeUncheckedCreateInput
{
    comments?: string;

    gradeId: string;

    studentId: string;

    score: number | Prisma.Decimal;
}
