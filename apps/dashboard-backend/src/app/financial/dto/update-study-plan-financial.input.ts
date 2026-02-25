import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class EnrollmentCostInput {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Int, { defaultValue: 0 })
  order: number;
}

@InputType()
export class UpdateStudyPlanFinancialInput {
  @Field(() => String)
  studyPlanId: string;

  @Field(() => Float, { nullable: true })
  monthlyTuitionAmount?: number;

  @Field(() => [Int], {
    nullable: true,
    description: 'Month numbers 1-12 when tuition is due',
  })
  tuitionMonths?: number[];

  @Field(() => [EnrollmentCostInput], { nullable: true })
  enrollmentCosts?: EnrollmentCostInput[];
}
