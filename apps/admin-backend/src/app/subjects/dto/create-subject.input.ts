import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateSubjectInput implements Prisma.SubjectUncheckedCreateInput {
  @Field(() => String, { description: 'Organization ID of the subject' })
  organizationId: string;
  @Field(() => String, { description: 'Name of the subject' })
  name: string;
  @Field(() => String, { description: 'Code of the subject' })
  code: string;
  @Field(() => String, { description: 'Short name of the subject' })
  shortName: string;
  @Field(() => String, { description: 'School ID of the subject' })
  schoolId: string;
}
