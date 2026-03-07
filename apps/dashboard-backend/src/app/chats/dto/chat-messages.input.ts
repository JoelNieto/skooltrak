import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ChatMessagesInput {
  @Field(() => String, { description: 'Chat ID' })
  chatId: string;

  @Field(() => String, {
    description: 'Cursor for pagination (message ID)',
    nullable: true,
  })
  cursor?: string;

  @Field(() => Int, {
    description: 'Number of messages to fetch',
    defaultValue: 50,
  })
  limit: number;
}
