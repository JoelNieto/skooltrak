import { Prisma } from '@generated/prisma';
import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StudentFinancialSummary {
  @Field(() => String)
  studentId: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  fatherName: string;

  @Field(() => Float)
  totalCharges: Prisma.Decimal;

  @Field(() => Float)
  totalPayments: Prisma.Decimal;

  @Field(() => Float)
  balance: Prisma.Decimal;
}
