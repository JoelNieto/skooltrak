import { Field, InputType } from '@nestjs/graphql';
import { $Enums, Prisma } from '@prisma/client';

@InputType()
export class CreateTeacherInput implements Prisma.TeacherUncheckedCreateInput {
  @Field(() => String, { description: 'First name of the teacher' })
  firstName: string;
  @Field(() => String, { description: 'Middle name of the teacher' })
  middleName: string;
  @Field(() => String, { description: 'Father name of the teacher' })
  fatherName: string;
  @Field(() => String, { description: 'Mother name of the teacher' })
  motherName: string;
  @Field(() => String, { description: 'Document ID of the teacher' })
  documentId: string;
  @Field(() => String, { description: 'Organization ID of the teacher' })
  organizationId: string;
  @Field(() => Date, { description: 'Birth date of the teacher' })
  birthDate: string | Date;
  @Field(() => String, { description: 'Gender of the teacher' })
  gender: $Enums.Gender;
  @Field(() => String, { description: 'User ID of the teacher' })
  userId: string;
}
