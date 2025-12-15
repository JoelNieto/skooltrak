import { $Enums, Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserTeacher
  implements Prisma.TeacherGetPayload<{ include: undefined }>
{
  teacherSince: number | null;
  memberSince: Date | null;
  address: string;
  phoneNumber: string;
  personalEmail: string;
  about: string;
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
  @Field(() => Date)
  birthDate: Date;
  @Field(() => String)
  gender: $Enums.Gender;
  @Field(() => String)
  userId: string;
  @Field(() => Date)
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
}
