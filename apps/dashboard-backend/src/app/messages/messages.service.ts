import { Inject, Injectable, Logger } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateMessageInput } from './dto/create-message.input';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}
  create(createMessageInput: CreateMessageInput) {
    const { req } = this.context;
    const { userId } = req.user as any;
    const { recipientIds, ...rest } = createMessageInput;

    return this.prisma.message.create({
      data: {
        ...rest,
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
    const { skip, take, orderBy } = query;

    return this.prisma.message.findMany({
      where: { senderId: userId, deletedAt: null },
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
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
    Logger.log('user', req.user);
    const { skip, take, orderBy } = query;

    return this.prisma.messageRecipient.findMany({
      where: { userId, deletedAt: null },
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        message: {
          include: { sender: true, recipients: { include: { user: true } } },
        },
      },
    });
  }

  findContacts() {
    const { req } = this.context;
    const { userId } = req.user as any;
  }

  findCount() {
    const { req } = this.context;
    const { userId } = req.user as any;
    return this.prisma.messageRecipient.count({
      where: { userId, deletedAt: null },
    });
  }

  findOne(id: string) {
    const { req } = this.context;
    const { userId } = req.user as any;
    return this.prisma.message.findUnique({
      where: {
        id,
        OR: [{ recipients: { some: { userId } } }, { senderId: id }],
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
}
