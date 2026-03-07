import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddChatParticipantsInput {
  @Field(() => String, { description: 'Chat ID' })
  chatId: string;

  @Field(() => [String], { description: 'User IDs to add' })
  userIds: string[];
}
