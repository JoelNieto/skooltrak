import { ChatParticipantRole } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatSyncService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a user to all existing contextual chats for a course.
   * Call when a student is added to a course.
   */
  async addUserToCourseChats(courseId: string, userId: string): Promise<void> {
    const chats = await this.prisma.chat.findMany({
      where: { courseId, deletedAt: null },
      select: { id: true },
    });
    for (const chat of chats) {
      await this.prisma.chatParticipant.upsert({
        where: {
          chatId_userId: { chatId: chat.id, userId },
        },
        create: {
          chatId: chat.id,
          userId,
          role: ChatParticipantRole.MEMBER,
        },
        update: {},
      });
    }
  }

  /**
   * Add a user to all existing contextual chats for a class group.
   * Also add to assignment chats where the assignment has an AssignmentDate for that class group.
   * Call when a student is assigned to a class group.
   */
  async addUserToClassGroupChats(classGroupId: string, userId: string): Promise<void> {
    const classGroupChats = await this.prisma.chat.findMany({
      where: { classGroupId, deletedAt: null },
      select: { id: true },
    });
    for (const chat of classGroupChats) {
      await this.prisma.chatParticipant.upsert({
        where: {
          chatId_userId: { chatId: chat.id, userId },
        },
        create: {
          chatId: chat.id,
          userId,
          role: ChatParticipantRole.MEMBER,
        },
        update: {},
      });
    }

    const assignmentDates = await this.prisma.assignmentDate.findMany({
      where: { classGroupId },
      include: { assignment: true },
    });
    for (const ad of assignmentDates) {
      const assignmentChats = await this.prisma.chat.findMany({
        where: { assignmentId: ad.assignmentId, deletedAt: null },
        select: { id: true },
      });
      for (const chat of assignmentChats) {
        await this.prisma.chatParticipant.upsert({
          where: {
            chatId_userId: { chatId: chat.id, userId },
          },
          create: {
            chatId: chat.id,
            userId,
            role: 'MEMBER',
          },
          update: {},
        });
      }
    }
  }

  /**
   * Add all students in a class group to an assignment chat.
   * Call when an AssignmentDate is created (linking assignment to class group).
   */
  async addClassGroupStudentsToAssignmentChat(
    assignmentId: string,
    classGroupId: string,
  ): Promise<void> {
    const chats = await this.prisma.chat.findMany({
      where: { assignmentId, deletedAt: null },
      select: { id: true },
    });
    if (chats.length === 0) return;

    const students = await this.prisma.student.findMany({
      where: { classGroupId },
      select: { userId: true },
    });

    for (const chat of chats) {
      for (const student of students) {
        if (!student.userId) continue;
        await this.prisma.chatParticipant.upsert({
          where: {
            chatId_userId: { chatId: chat.id, userId: student.userId },
          },
          create: {
            chatId: chat.id,
            userId: student.userId,
            role: ChatParticipantRole.MEMBER,
          },
          update: {},
        });
      }
    }
  }
}
