import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateSubjectInput {
  @Field(() => String, { description: 'Code of the subject' })
  code: string;
  @Field(() => String, { description: 'Name of the subject' })
  name: string;
}
