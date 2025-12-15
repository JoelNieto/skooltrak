import { $Enums, Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserStudent
  implements Prisma.StudentGetPayload<{ include: undefined }>
{
  @Field(() => String)
  id: string;
  @Field(() => String)
  firstName: string;
  @Field(() => String)
  middleName: string;
  @Field(() => String)
  fatherName: string;
  @Field(() => String)
  motherName: string;
  @Field(() => String)
  documentId: string;
  @Field(() => String)
  organizationId: string;
  @Field(() => String)
  schoolId: string;
  @Field(() => String)
  classGroupId: string;
  @Field(() => Date)
  birthDate: Date;
  @Field(() => String)
  gender: $Enums.Gender;
  @Field(() => String)
  address: string;
  @Field(() => String)
  phone: string;
  @Field(() => String)
  userId: string;
  @Field(() => Date)
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
}
