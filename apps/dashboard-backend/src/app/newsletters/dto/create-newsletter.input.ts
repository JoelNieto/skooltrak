import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateNewsletterInput {
  @Field(() => String, { description: 'Title of the newsletter' })
  title: string;

  @Field(() => String, { description: 'Content of the newsletter (HTML)' })
  content: string;

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: false,
    description: 'Whether to publish immediately',
  })
  published?: boolean;

  @Field(() => String, { description: 'School ID the newsletter belongs to' })
  schoolId: string;
}
