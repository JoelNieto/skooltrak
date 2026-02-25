import { Prisma } from '@generated/prisma';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StudyPlanEnrollmentCost
  implements Prisma.StudyPlanEnrollmentCostGetPayload<{ include: undefined }>
{
  @Field(() => String)
  id: string;

  @Field(() => String)
  studyPlanId: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  amount: Prisma.Decimal;

  @Field(() => Int)
  order: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
