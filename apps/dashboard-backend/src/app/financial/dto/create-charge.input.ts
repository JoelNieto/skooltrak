import { $Enums } from '@generated/prisma';
import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateChargeInput {
  @Field(() => String)
  schoolId: string;

  @Field(() => Int)
  year: number;

  @Field(() => String, { nullable: true })
  studentId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'If provided, creates charges for all students in class groups using this study plan',
  })
  studyPlanId?: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Date)
  dueDate: Date;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  chargeType?: $Enums.ChargeType;
}
