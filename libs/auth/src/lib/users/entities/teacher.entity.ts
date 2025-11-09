import { Field, ObjectType } from '@nestjs/graphql';
import { $Enums, Prisma } from '@prisma/client';

@ObjectType()
export class UserTeacher
  implements Prisma.TeacherGetPayload<{ include: undefined }>
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
