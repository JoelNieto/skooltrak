import { User } from '@/auth';
import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
@ObjectType()
export class Message
  implements Prisma.MessageGetPayload<{ include: { recipients: true } }>
{
  @Field(() => String, {
    description: 'The unique identifier for the message.',
  })
  id: string;

  @Field(() => String, { description: 'The subject of the message.' })
  subject: string;

  @Field(() => String, { description: 'The content of the message.' })
  content: string;

  @Field(() => String, {
    description: 'The ID of the organization associated with the message.',
  })
  organizationId: string;

  @Field(() => String, {
    description: 'The ID of the sender associated with the message.',
  })
  senderId: string;

  @Field(() => User, {
    description: 'The sender associated with the message.',
  })
  sender: User;

  @Field(() => [MessageRecipient], {
    description: 'The recipients of the message.',
  })
  recipients: MessageRecipient[];

  @Field(() => Date, {
    description: 'The date and time the message was created.',
  })
  createdAt: Date;

  @Field(() => Date, {
    description: 'The date and time the message was last updated.',
  })
  updatedAt: Date;

  @Field(() => Date, {
    description: 'The date and time the message was deleted.',
    nullable: true,
  })
  deletedAt: Date | null;
}

@ObjectType()
export class MessageRecipient
  implements Prisma.MessageRecipientGetPayload<{ include: { user: true } }>
{
  @Field(() => String, {
    description: 'The unique identifier for the message recipient.',
  })
  id: string;

  @Field(() => String, {
    description: 'The ID of the message associated with the message recipient.',
  })
  messageId: string;

  @Field(() => Message, {
    description: 'The message associated with the message recipient.',
  })
  message: Message;

  @Field(() => String, {
    description: 'The ID of the user associated with the message recipient.',
  })
  userId: string;

  @Field(() => User, {
    description: 'The user associated with the message recipient.',
  })
  user: User;

  @Field(() => Date, {
    description: 'The date and time the message was read.',
    nullable: true,
  })
  readAt: Date;

  @Field(() => Date, {
    description: 'The date and time the message recipient was created.',
  })
  createdAt: Date;

  @Field(() => Date, {
    description: 'The date and time the message recipient was last updated.',
  })
  updatedAt: Date;

  @Field(() => Date, {
    description: 'The date and time the message recipient was deleted.',
    nullable: true,
  })
  deletedAt: Date | null;
}
