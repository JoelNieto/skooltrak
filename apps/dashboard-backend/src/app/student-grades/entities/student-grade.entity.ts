import { Prisma } from '@generated/prisma';
import { Grade } from '../../grades/entities/grade.entity';
import { Student } from '../../students/entities/student.entity';
export class StudentGrade
  implements
    Prisma.StudentGradeGetPayload<{ include: { student: true; grade: true } }>
{
    id: string;
    student: Student;
    grade: Grade;
    comments: string;
    gradeId: string;
    studentId: string;
    score: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;

    averageScoreForStudent: number;
}
