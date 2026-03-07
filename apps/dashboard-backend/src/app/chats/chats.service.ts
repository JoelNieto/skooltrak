import { ChatParticipantRole, ChatType } from '@generated/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { ChatPubSub } from './chat-pubsub';
import { AddChatParticipantsInput } from './dto/add-chat-participants.input';
import { ChatMessagesInput } from './dto/chat-messages.input';
import { CreateContextualChatInput } from './dto/create-contextual-chat.input';
import { CreateGroupChatInput } from './dto/create-group-chat.input';
import { SendMessageInput } from './dto/send-message.input';

const CHAT_INCLUDE = {
  participants: {
    include: {
      user: {
        include: {
          role: true,
          student: { include: { classGroup: true } },
          teacher: true,
        },
      },
    },
  },
  createdBy: {
    include: {
      role: true,
      student: { include: { classGroup: true } },
      teacher: true,
    },
  },
  course: true,
  assignment: true,
  classGroup: true,
} as const;

@Injectable({ scope: Scope.REQUEST })
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatPubSub: ChatPubSub,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {}

  private getAuth() {
    const { req } = this.context;
    const { userId, organizationId, role } = req.user as {
      userId: string;
      organizationId: string | null;
      role: string;
    };
    return { userId, organizationId, role };
  }

  private isAdmin(role: string): boolean {
    return role === 'ADMIN' || role === 'ORG_ADMIN' || role === 'SYSADMIN';
  }

  private async validateCanCreateContextualChat(
    contextType: ChatType,
    contextId: string,
  ): Promise<{ organizationId: string; name: string }> {
    const { userId, organizationId, role } = this.getAuth();

    if (!organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    if (this.isAdmin(role)) {
      return { organizationId, name: contextId };
    }

    if (
      contextType !== ChatType.COURSE &&
      contextType !== ChatType.ASSIGNMENT &&
      contextType !== ChatType.CLASS_GROUP
    ) {
      throw new BadRequestException('Invalid context type for contextual chat');
    }

    if (contextType === ChatType.COURSE) {
      const course = await this.prisma.course.findUnique({
        where: { id: contextId },
        include: { teacher: true, organization: true },
      });
      if (!course) throw new NotFoundException('Course not found');
      if (course.organizationId !== organizationId) {
        throw new ForbiddenException('Course not in your organization');
      }
      if (course.teacher?.userId !== userId) {
        throw new ForbiddenException('Only the course teacher or admin can create this chat');
      }
      return { organizationId, name: course.name };
    }

    if (contextType === ChatType.ASSIGNMENT) {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: contextId },
        include: { teacher: true, course: true },
      });
      if (!assignment) throw new NotFoundException('Assignment not found');
      if (assignment.course.organizationId !== organizationId) {
        throw new ForbiddenException('Assignment not in your organization');
      }
      if (assignment.teacher?.userId !== userId) {
        throw new ForbiddenException('Only the assignment teacher or admin can create this chat');
      }
      return { organizationId, name: assignment.title };
    }

    if (contextType === ChatType.CLASS_GROUP) {
      const classGroup = await this.prisma.classGroup.findUnique({
        where: { id: contextId },
        include: { teacher: true },
      });
      if (!classGroup) throw new NotFoundException('Class group not found');
      if (classGroup.organizationId !== organizationId) {
        throw new ForbiddenException('Class group not in your organization');
      }
      if (classGroup.teacher?.userId !== userId) {
        throw new ForbiddenException('Only the class group teacher or admin can create this chat');
      }
      return { organizationId, name: classGroup.name };
    }

    throw new BadRequestException('Invalid context type');
  }

  private async resolveContextualParticipants(
    contextType: ChatType,
    contextId: string,
  ): Promise<{ userId: string; role: ChatParticipantRole }[]> {
    const participants: { userId: string; role: ChatParticipantRole }[] = [];

    if (contextType === ChatType.COURSE) {
      const course = await this.prisma.course.findUnique({
        where: { id: contextId },
        include: {
          teacher: true,
          students: { include: { user: true } },
        },
      });
      if (!course) return [];
      if (course.teacher?.userId) {
        participants.push({ userId: course.teacher.userId, role: ChatParticipantRole.ADMIN });
      }
      for (const student of course.students) {
        participants.push({ userId: student.userId, role: ChatParticipantRole.MEMBER });
      }
    } else if (contextType === ChatType.ASSIGNMENT) {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: contextId },
        include: {
          teacher: true,
          dates: {
            include: {
              classGroup: {
                include: { students: { include: { user: true } } },
              },
            },
          },
        },
      });
      if (!assignment) return [];
      const userIds = new Map<string, ChatParticipantRole>();
      if (assignment.teacher?.userId) {
        userIds.set(assignment.teacher.userId, ChatParticipantRole.ADMIN);
      }
      for (const ad of assignment.dates) {
        for (const student of ad.classGroup.students) {
          if (!userIds.has(student.userId)) {
            userIds.set(student.userId, ChatParticipantRole.MEMBER);
          }
        }
      }
      for (const [uid, role] of userIds) {
        participants.push({ userId: uid, role });
      }
    } else if (contextType === ChatType.CLASS_GROUP) {
      const classGroup = await this.prisma.classGroup.findUnique({
        where: { id: contextId },
        include: {
          teacher: true,
          students: { include: { user: true } },
        },
      });
      if (!classGroup) return [];
      if (classGroup.teacher?.userId) {
        participants.push({ userId: classGroup.teacher.userId, role: ChatParticipantRole.ADMIN });
      }
      for (const student of classGroup.students) {
        participants.push({ userId: student.userId, role: ChatParticipantRole.MEMBER });
      }
    }

    return participants;
  }

  async createDirectChat(recipientId: string) {
    const { userId, organizationId } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (recipientId === userId) throw new BadRequestException('Cannot chat with yourself');

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) throw new NotFoundException('Recipient not found');
    if (recipient.organizationId !== organizationId) {
      throw new ForbiddenException('Recipient not in your organization');
    }

    const existing = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.DIRECT,
        deletedAt: null,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: CHAT_INCLUDE,
    });

    if (existing && existing.participants.length === 2) {
      return existing;
    }

    return this.prisma.chat.create({
      data: {
        organizationId,
        type: ChatType.DIRECT,
        createdById: userId,
        participants: {
          create: [
            { userId, role: ChatParticipantRole.ADMIN },
            { userId: recipientId, role: ChatParticipantRole.MEMBER },
          ],
        },
      },
      include: CHAT_INCLUDE,
    });
  }

  async createGroupChat(input: CreateGroupChatInput) {
    const { userId, organizationId } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');

    const allIds = [...new Set([userId, ...input.participantIds])];
    const users = await this.prisma.user.findMany({
      where: { id: { in: allIds }, organizationId },
    });
    if (users.length !== allIds.length) {
      throw new BadRequestException('All participants must be in your organization');
    }

    return this.prisma.chat.create({
      data: {
        organizationId,
        name: input.name,
        type: ChatType.GROUP,
        createdById: userId,
        participants: {
          create: allIds.map((uid) => ({
            userId: uid,
            role: uid === userId ? ChatParticipantRole.ADMIN : ChatParticipantRole.MEMBER,
          })),
        },
      },
      include: CHAT_INCLUDE,
    });
  }

  async createContextualChat(input: CreateContextualChatInput) {
    const { userId } = this.getAuth();
    const { contextType, contextId } = input;

    const { organizationId, name } = await this.validateCanCreateContextualChat(contextType, contextId);
    const participants = await this.resolveContextualParticipants(contextType, contextId);

    const data: Record<string, unknown> = {
      organizationId,
      name,
      type: contextType,
      createdById: userId,
      participants: {
        create: participants.map((p) => ({
          userId: p.userId,
          role: p.role,
        })),
      },
    };

    if (contextType === ChatType.COURSE) data.courseId = contextId;
    else if (contextType === ChatType.ASSIGNMENT) data.assignmentId = contextId;
    else if (contextType === ChatType.CLASS_GROUP) data.classGroupId = contextId;

    const existingWhere =
      contextType === ChatType.COURSE
        ? { courseId: contextId }
        : contextType === ChatType.ASSIGNMENT
          ? { assignmentId: contextId }
          : { classGroupId: contextId };

    const existing = await this.prisma.chat.findFirst({
      where: { ...existingWhere, deletedAt: null },
      include: CHAT_INCLUDE,
    });

    if (existing) return existing;

    return this.prisma.chat.create({
      data: data as never,
      include: CHAT_INCLUDE,
    });
  }

  async myChats() {
    const { userId, organizationId } = this.getAuth();
    if (!organizationId) return [];

    return this.prisma.chat.findMany({
      where: {
        organizationId,
        deletedAt: null,
        participants: { some: { userId } },
      },
      include: CHAT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async chat(id: string) {
    const { userId } = this.getAuth();

    const chat = await this.prisma.chat.findFirst({
      where: {
        id,
        deletedAt: null,
        participants: { some: { userId } },
      },
      include: CHAT_INCLUDE,
    });

    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async chatMessages(input: ChatMessagesInput) {
    const { userId } = this.getAuth();

    const participant = await this.prisma.chatParticipant.findFirst({
      where: { chatId: input.chatId, userId },
    });
    if (!participant) throw new ForbiddenException('Not a participant of this chat');

    const cursor = input.cursor
      ? { id: input.cursor }
      : undefined;

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId: input.chatId, deletedAt: null },
      take: Math.min(input.limit, 100),
      skip: cursor ? 1 : 0,
      cursor,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          include: {
            role: true,
            student: { include: { classGroup: true } },
            teacher: true,
          },
        },
      },
    });

    return messages.reverse();
  }

  async sendMessage(input: SendMessageInput) {
    const { userId } = this.getAuth();

    const participant = await this.prisma.chatParticipant.findFirst({
      where: { chatId: input.chatId, userId },
    });
    if (!participant) throw new ForbiddenException('Not a participant of this chat');

    const chat = await this.prisma.chat.findUnique({
      where: { id: input.chatId },
    });
    if (!chat || chat.deletedAt) throw new NotFoundException('Chat not found');

    const message = await this.prisma.chatMessage.create({
      data: {
        chatId: input.chatId,
        senderId: userId,
        content: input.content.trim(),
        replyToId: input.replyToId || undefined,
      },
      include: {
        sender: {
          include: {
            role: true,
            student: { include: { classGroup: true } },
            teacher: true,
          },
        },
      },
    });

    this.chatPubSub.publishMessageReceived(input.chatId, message);

    return message;
  }

  async addChatParticipants(input: AddChatParticipantsInput) {
    const { userId } = this.getAuth();

    const chat = await this.prisma.chat.findFirst({
      where: {
        id: input.chatId,
        deletedAt: null,
        participants: {
          some: { userId, role: ChatParticipantRole.ADMIN },
        },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found or you do not have permission');
    if (chat.type !== ChatType.GROUP) {
      throw new ForbiddenException('Cannot add participants to contextual or direct chats');
    }

    const { organizationId } = this.getAuth();
    const users = await this.prisma.user.findMany({
      where: { id: { in: input.userIds }, organizationId },
    });
    if (users.length !== input.userIds.length) {
      throw new BadRequestException('All users must be in your organization');
    }

    const existing = await this.prisma.chatParticipant.findMany({
      where: { chatId: input.chatId, userId: { in: input.userIds } },
    });
    const existingIds = new Set(existing.map((p) => p.userId));
    const toAdd = input.userIds.filter((id) => !existingIds.has(id));

    if (toAdd.length === 0) return this.chat(input.chatId);

    await this.prisma.chatParticipant.createMany({
      data: toAdd.map((uid) => ({
        chatId: input.chatId,
        userId: uid,
        role: ChatParticipantRole.MEMBER,
      })),
    });

    return this.chat(input.chatId);
  }

  async leaveChat(chatId: string) {
    const { userId } = this.getAuth();

    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, deletedAt: null },
      include: { participants: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== ChatType.DIRECT && chat.type !== ChatType.GROUP) {
      throw new ForbiddenException('Cannot leave contextual chats');
    }

    const participant = chat.participants.find((p) => p.userId === userId);
    if (!participant) throw new ForbiddenException('Not a participant');

    if (chat.participants.length <= 1) {
      throw new BadRequestException('Cannot leave when you are the only participant');
    }

    await this.prisma.chatParticipant.delete({
      where: { id: participant.id },
    });

    return { success: true };
  }

  async markChatRead(chatId: string) {
    const { userId } = this.getAuth();

    const participant = await this.prisma.chatParticipant.findFirst({
      where: { chatId, userId },
    });
    if (!participant) throw new ForbiddenException('Not a participant of this chat');

    const updated = await this.prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
    return updated;
  }

  async unreadCount() {
    const { userId } = this.getAuth();

    const participants = await this.prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true, lastReadAt: true },
    });

    let count = 0;
    for (const p of participants) {
      const lastMessage = await this.prisma.chatMessage.findFirst({
        where: { chatId: p.chatId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (lastMessage && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt)) {
        count++;
      }
    }
    return count;
  }
}
