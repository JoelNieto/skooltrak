import { User } from '@/auth';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChatMessage {
  @Field(() => String)
  id: string;

  @Field(() => String)
  chatId: string;

  @Field(() => String, { nullable: true })
  senderId: string | null;

  @Field(() => User, { nullable: true })
  sender: User | null;

  @Field(() => String)
  content: string;

  @Field(() => String, { nullable: true })
  replyToId: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null;
}
