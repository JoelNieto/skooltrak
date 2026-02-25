import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePaymentInput {
  @Field(() => String)
  studentId: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Date)
  paidAt: Date;

  @Field(() => String, { nullable: true })
  reference?: string;

  @Field(() => String, { nullable: true })
  createdBy?: string;
}
