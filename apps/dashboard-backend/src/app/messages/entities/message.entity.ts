import { User } from '@/auth';
import { Prisma } from '@generated/prisma';
export class Message
  implements
    Omit<Prisma.MessageGetPayload<{ include: { recipients: true; replies: true } }>, 'replies' | 'parentMessage'>
{
    id: string;

    subject: string;

    content: string;

    organizationId: string;

    senderId: string | null;

    sender: User;

    recipients: MessageRecipient[];

    parentMessageId: string | null;

  // replies field is resolved via @ResolveField in the resolver
  // to avoid circular dependency issues

    createdAt: Date;

    updatedAt: Date;

    deletedAt: Date | null;
}

export class MessageRecipient implements Prisma.MessageRecipientGetPayload<{ include: { user: true } }> {
    id: string;

    messageId: string;

    message: Message;

    userId: string;

    user: User;

    readAt: Date;

    createdAt: Date;

    updatedAt: Date;

    deletedAt: Date | null;
}
