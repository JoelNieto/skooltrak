import { HabitValue, Prisma } from '@generated/prisma';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

// Register the HabitValue enum for GraphQL
registerEnumType(HabitValue, {
  name: 'HabitValue',
  description: 'Valores de evaluación de hábitos',
  valuesMap: {
    X: { description: 'Desempeño deficiente' },
    R: { description: 'Desempeño regular' },
    S: { description: 'Desempeño satisfactorio' },
  },
});

@ObjectType()
export class StudentHabitEvaluation
  implements Prisma.StudentHabitEvaluationGetPayload<{ include: undefined }>
{
  @Field(() => String)
  id: string;

  @Field(() => String)
  habitEvaluationId: string;

  @Field(() => String)
  studentId: string;

  @Field(() => HabitValue)
  value: HabitValue;

  @Field(() => String, { nullable: true })
  comments: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
