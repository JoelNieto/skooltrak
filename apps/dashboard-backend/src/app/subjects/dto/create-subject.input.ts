import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateSubjectInput implements Prisma.SubjectUncheckedCreateInput {
  @Field(() => String, { description: 'Short name of the subject' })
  shortName: string;
  @Field(() => String, { description: 'Organization ID' })
  organizationId: string;
  @Field(() => String, { description: 'Code of the subject' })
  code: string;
  @Field(() => String, { description: 'Name of the subject' })
  name: string;
}
