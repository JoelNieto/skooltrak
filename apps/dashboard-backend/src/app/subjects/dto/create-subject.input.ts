import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateSubjectInput implements Prisma.SubjectUncheckedCreateInput {
  @Field(() => String, { description: 'Short name of the subject' })
  shortName: string;
  @Field(() => String, { description: 'Code of the subject' })
  code: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  @Field(() => String, { description: 'School ID' })
  schoolId: string;
  @Field(() => String, { description: 'Name of the subject' })
  name: string;
}
