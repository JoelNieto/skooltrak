import { Field, InputType } from '@nestjs/graphql';

import { $Enums, Prisma } from '@prisma/client';
type CreateTeacherInputType = Omit<
  Prisma.TeacherUncheckedCreateInput,
  'userId'
> & {
  email: string;
};

@InputType()
export class CreateTeacherInput implements CreateTeacherInputType {
  @Field(() => String, { description: 'First name of the teacher' })
  firstName: string;
  @Field(() => String, {
    description: 'Middle name of the teacher',
    nullable: true,
    defaultValue: '',
  })
  middleName: string;
  @Field(() => String, { description: 'Father name of the teacher' })
  fatherName: string;
  @Field(() => String, {
    description: 'Mother name of the teacher',
    nullable: true,
    defaultValue: '',
  })
  motherName: string;
  @Field(() => String, { description: 'Document ID of the teacher' })
  documentId: string;
  @Field(() => String, { description: 'Organization ID of the teacher' })
  organizationId: string;
  @Field(() => Date, {
    description: 'Birth date of the teacher',
    nullable: true,
    defaultValue: new Date(),
  })
  birthDate: Date;

  @Field(() => String, { nullable: true, defaultValue: '' })
  address?: string;

  @Field(() => String, { nullable: true, defaultValue: '' })
  about?: string;

  @Field(() => String, { nullable: true, defaultValue: '' })
  phoneNumber?: string;

  @Field(() => String, { nullable: true, defaultValue: '' })
  personalEmail?: string;
  @Field(() => String, { description: 'Gender of the teacher' })
  gender: $Enums.Gender;
  @Field(() => String, { description: 'Email of the teacher' })
  email: string;
}
