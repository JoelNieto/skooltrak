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
  @Field(() => String, { nullable: true })
  classGroupId: string | null;
  @Field(() => Date)
  birthDate: Date;
  @Field(() => String)
  gender: $Enums.Gender;
  @Field(() => String)
  address: string;
  @Field(() => String)
  phone: string;
  @Field(() => String)
  enrollmentStatus: $Enums.EnrollmentStatus;
  @Field(() => String)
  bloodType: string;
  @Field(() => String)
  allergies: string;
  @Field(() => String)
  medicalNotes: string;
  @Field(() => String)
  emergencyContactName: string;
  @Field(() => String)
  emergencyContactPhone: string;
  @Field(() => String)
  userId: string;
  @Field(() => Date)
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
}
