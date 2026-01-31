import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateMessageInput } from './dto/create-message.input';

@Injectable({ scope: Scope.REQUEST })
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {}
  create(createMessageInput: CreateMessageInput) {
    const { req } = this.context;
    const { userId, organizationId } = req.user as any;
    const { recipientIds, ...rest } = createMessageInput;

    return this.prisma.message.create({
      data: {
        ...rest,
        organizationId,
        senderId: userId,
        recipients: {
          create: recipientIds.map((recipientId) => ({
            user: { connect: { id: recipientId } },
          })),
        },
      },
      include: {
        recipients: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  findManyBySender(query: FetchDataInput) {
    const { req } = this.context;
    const { userId } = req.user as any;
    const { skip, take } = query;

    return this.prisma.message.findMany({
      where: {
        senderId: userId,
        deletedAt: null,
        parentMessageId: null,
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: true,
        recipients: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  findMany(query: FetchDataInput) {
    const { req } = this.context;
    const { userId } = req.user as any;
    const { skip, take } = query;

    return this.prisma.messageRecipient.findMany({
      where: { userId, deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: { sender: true, recipients: { include: { user: true } } },
        },
      },
    });
  }

  findContacts(queryText?: string) {
    const { req } = this.context;
    const { organizationId } = req.user as any;

    return this.prisma.user.findMany({
      include: {
        student: { include: { classGroup: true } },
        teacher: { include: { classGroups: true } },
        role: true,
      },
      where: {
        organizationId,
        OR: [
          { firstName: { contains: queryText, mode: 'insensitive' } },
          { lastName: { contains: queryText, mode: 'insensitive' } },
        ],
      },
      orderBy: { firstName: 'asc' },
    });
  }

  findCount() {
    const { req } = this.context;
    const { userId } = req.user as any;
    return this.prisma.messageRecipient.count({
      where: { userId, deletedAt: null },
    });
  }

  findSentCount() {
    const { req } = this.context;
    const { userId } = req.user as any;
    return this.prisma.message.count({
      where: { senderId: userId, deletedAt: null, parentMessageId: null },
    });
  }

  findOne(id: string) {
    const { req } = this.context;
    const { userId } = req.user as any;
    return this.prisma.message.findUnique({
      where: {
        id,
        OR: [{ recipients: { some: { userId } } }, { senderId: userId }],
      },
      include: {
        sender: { include: { role: true, student: true, teacher: true } },
        recipients: {
          include: {
            user: { include: { role: true, student: true, teacher: true } },
          },
        },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { include: { role: true, student: true, teacher: true } },
            recipients: {
              include: {
                user: { include: { role: true, student: true, teacher: true } },
              },
            },
          },
        },
      },
    });
  }

  findReplies(messageId: string) {
    return this.prisma.message.findMany({
      where: {
        parentMessageId: messageId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { include: { role: true, student: true, teacher: true } },
        recipients: {
          include: {
            user: { include: { role: true, student: true, teacher: true } },
          },
        },
      },
    });
  }

  remove(id: string) {
    const { req } = this.context;
    const { userId } = req.user as any;

    return this.prisma.message.update({
      where: { id, senderId: userId },
      data: { deletedAt: new Date() },
    });
  }

  removeRecipient(id: string) {
    const { req } = this.context;
    const { userId } = req.user as any;

    return this.prisma.messageRecipient.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
  }

  async markAsRead(messageId: string) {
    const { req } = this.context;
    const { userId } = req.user as any;

    // Find the recipient record for this user and message
    const recipient = await this.prisma.messageRecipient.findFirst({
      where: {
        messageId,
        userId,
        readAt: null,
      },
    });

    if (!recipient) {
      return null; // Already read or not a recipient
    }

    return this.prisma.messageRecipient.update({
      where: { id: recipient.id },
      data: { readAt: new Date() },
    });
  }

  findUnreadCount() {
    const { req } = this.context;
    const { userId } = req.user as any;
    return this.prisma.messageRecipient.count({
      where: { userId, deletedAt: null, readAt: null },
    });
  }
}
