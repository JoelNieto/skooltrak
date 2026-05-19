import { HabitValue, Prisma } from '@generated/prisma';
// Register the HabitValue enum for GraphQL
export class StudentHabitEvaluation
  implements Prisma.StudentHabitEvaluationGetPayload<{ include: undefined }>
{
    id: string;

    habitEvaluationId: string;

    studentId: string;

    value: HabitValue;

    comments: string | null;

    createdAt: Date;

    updatedAt: Date;
}
