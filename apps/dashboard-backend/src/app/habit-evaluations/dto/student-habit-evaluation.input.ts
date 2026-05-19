import { HabitValue } from '@generated/prisma';
export class StudentHabitEvaluationInput {
    studentId: string;

    value: HabitValue;

    comments?: string;
}
