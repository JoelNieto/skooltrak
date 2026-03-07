import { User } from '@/auth';
import { ChatParticipantRole } from '@generated/prisma';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

registerEnumType(ChatParticipantRole, { name: 'ChatParticipantRole' });

@ObjectType()
export class ChatParticipant {
  @Field(() => String)
  id: string;

  @Field(() => String)
  chatId: string;

  @Field(() => String)
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => ChatParticipantRole)
  role: ChatParticipantRole;

  @Field(() => Date)
  joinedAt: Date;

  @Field(() => Date, { nullable: true })
  lastReadAt: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
