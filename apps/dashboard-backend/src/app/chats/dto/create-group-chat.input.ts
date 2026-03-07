import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateGroupChatInput {
  @Field(() => String, { description: 'Name of the group chat' })
  name: string;

  @Field(() => [String], {
    description: 'User IDs of initial participants (excluding creator)',
  })
  participantIds: string[];
}
