import { Prisma } from '@generated/prisma';
import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StudentBalance {
  @Field(() => String)
  studentId: string;

  @Field(() => Float)
  totalCharges: Prisma.Decimal;

  @Field(() => Float)
  totalPayments: Prisma.Decimal;

  @Field(() => Float)
  balance: Prisma.Decimal;
}
