import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SendMessageInput {
  @Field(() => String, { description: 'Chat ID' })
  chatId: string;

  @Field(() => String, { description: 'Message content' })
  content: string;

  @Field(() => String, {
    description: 'Optional reply to message ID',
    nullable: true,
  })
  replyToId?: string;
}
