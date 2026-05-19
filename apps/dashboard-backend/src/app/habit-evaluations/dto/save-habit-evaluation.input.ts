import { StudentHabitEvaluationInput } from './student-habit-evaluation.input';

export class SaveHabitEvaluationInput {
    classGroupId: string;

    periodId: string;

    habitMetricId: string;

    studentEvaluations: StudentHabitEvaluationInput[];

    published?: boolean;
}
