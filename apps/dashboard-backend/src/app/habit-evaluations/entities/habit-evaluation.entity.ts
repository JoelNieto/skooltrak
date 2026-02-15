import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { StudentHabitEvaluation } from './student-habit-evaluation.entity';

@ObjectType()
export class HabitEvaluation
  implements
    Prisma.HabitEvaluationGetPayload<{
      include: { studentEvaluations: true };
    }>
{
  @Field(() => String)
  id: string;

  @Field(() => String)
  habitMetricId: string;

  @Field(() => String)
  classGroupId: string;

  @Field(() => String)
  periodId: string;

  @Field(() => String)
  teacherId: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => Boolean)
  published: boolean;

  @Field(() => [StudentHabitEvaluation])
  studentEvaluations: StudentHabitEvaluation[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
