import { $Enums, Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
type CreateStudentInputType = Omit<
  Prisma.StudentUncheckedCreateInput,
  'userId'
> & {
  email: string;
};
@InputType()
export class CreateStudentInput implements CreateStudentInputType {
  @Field(() => String, { description: 'First name of the student' })
  firstName: string;
  @Field(() => String, { description: 'Middle name of the student' })
  middleName: string;
  @Field(() => String, { description: 'Father name of the student' })
  fatherName: string;
  @Field(() => String, { description: 'Mother name of the student' })
  motherName: string;
  @Field(() => String, { description: 'Document ID of the student' })
  documentId: string;
  @Field(() => String, { description: 'Organization ID of the student' })
  organizationId: string;
  @Field(() => String, { description: 'School ID of the student' })
  schoolId: string;
  @Field(() => String, { description: 'Class group ID of the student' })
  classGroupId: string;
  @Field(() => Date, { description: 'Birth date of the student' })
  birthDate: string | Date;
  @Field(() => String, { description: 'Gender of the student' })
  gender: $Enums.Gender;
  @Field(() => String, { description: 'Address of the student' })
  address: string;
  @Field(() => String, { description: 'Phone of the student' })
  phone: string;
  @Field(() => String, { description: 'Email of the student' })
  email: string;
}
