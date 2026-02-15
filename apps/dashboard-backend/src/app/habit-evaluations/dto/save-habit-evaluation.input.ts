import { Field, InputType } from '@nestjs/graphql';
import { StudentHabitEvaluationInput } from './student-habit-evaluation.input';

@InputType()
export class SaveHabitEvaluationInput {
  @Field(() => String, { description: 'ID del grupo' })
  classGroupId: string;

  @Field(() => String, { description: 'ID del período' })
  periodId: string;

  @Field(() => String, { description: 'ID de la métrica de hábito' })
  habitMetricId: string;

  @Field(() => [StudentHabitEvaluationInput], {
    description: 'Evaluaciones de estudiantes',
  })
  studentEvaluations: StudentHabitEvaluationInput[];

  @Field(() => Boolean, {
    nullable: true,
    description: 'Si la evaluación está publicada',
  })
  published?: boolean;
}
