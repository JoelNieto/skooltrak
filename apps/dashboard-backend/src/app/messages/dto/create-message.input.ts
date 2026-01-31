import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateMessageInput {
  @Field(() => String, { description: 'The subject of the message.' })
  subject: string;

  @Field(() => String, { description: 'The content of the message.' })
  content: string;

  @Field(() => [String], {
    description: 'The IDs of the recipients associated with the message.',
  })
  recipientIds: string[];

  @Field(() => String, {
    description: 'The ID of the parent message (for replies).',
    nullable: true,
  })
  parentMessageId?: string;
}
