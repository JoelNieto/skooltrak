import { HabitValue } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class StudentHabitEvaluationInput {
  @Field(() => String, { description: 'ID del estudiante' })
  studentId: string;

  @Field(() => HabitValue, { description: 'Valor de la evaluación' })
  value: HabitValue;

  @Field(() => String, { nullable: true, description: 'Comentarios opcionales' })
  comments?: string;
}
