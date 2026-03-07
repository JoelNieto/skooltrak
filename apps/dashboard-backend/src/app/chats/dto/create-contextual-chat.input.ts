import { ChatType } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateContextualChatInput {
  @Field(() => ChatType, {
    description: 'Context type: COURSE, ASSIGNMENT, or CLASS_GROUP',
  })
  contextType: ChatType;

  @Field(() => String, {
    description: 'ID of the course, assignment, or class group',
  })
  contextId: string;
}
