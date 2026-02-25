import { Prisma } from '@generated/prisma';
import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Student } from '../../students/entities/student.entity';

@ObjectType()
export class Payment
  implements Prisma.PaymentGetPayload<{ include: { student: true } }>
{
  @Field(() => String)
  id: string;

  @Field(() => String)
  studentId: string;

  @Field(() => Student)
  student: Student;

  @Field(() => Float)
  amount: Prisma.Decimal;

  @Field(() => Date)
  paidAt: Date;

  @Field(() => String, { nullable: true })
  reference: string | null;

  @Field(() => String, { nullable: true })
  createdBy: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
