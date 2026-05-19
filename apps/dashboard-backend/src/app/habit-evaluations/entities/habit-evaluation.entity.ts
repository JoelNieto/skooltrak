import { Prisma } from '@generated/prisma';
import { StudentHabitEvaluation } from './student-habit-evaluation.entity';

export class HabitEvaluation
  implements
    Prisma.HabitEvaluationGetPayload<{
      include: { studentEvaluations: true };
    }>
{
    id: string;

    habitMetricId: string;

    classGroupId: string;

    periodId: string;

    teacherId: string;

    organizationId: string;

    published: boolean;

    studentEvaluations: StudentHabitEvaluation[];

    createdAt: Date;

    updatedAt: Date;
}
