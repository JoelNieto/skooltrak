import { ChatType } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { addYears, addDays } from 'date-fns';
import { PrismaService } from '../prisma.service';

/**
 * Chat retention job – soft-deletes chats past their retention period.
 *
 * Retention rules (from plan):
 * - Contextual (course, assignment, class group): 2 years after context ends
 * - Direct and group: 1 year after last message
 */
@Injectable()
export class ChatRetentionService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * 0') // Every Sunday at 3:00 AM
  async runRetentionJob() {
    const now = new Date();
    const deleted = await this.softDeleteExpiredChats(now);
    if (deleted > 0) {
      console.log(`[ChatRetention] Soft-deleted ${deleted} chats past retention`);
    }
  }

  async softDeleteExpiredChats(now: Date): Promise<number> {
    const expiredIds: string[] = [];

    const chats = await this.prisma.chat.findMany({
      where: { deletedAt: null },
      include: {
        course: true,
        assignment: true,
        classGroup: true,
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    for (const chat of chats) {
      const retentionEnd = this.computeRetentionEnd(chat, now);
      if (retentionEnd && now >= retentionEnd) {
        expiredIds.push(chat.id);
      }
    }

    if (expiredIds.length === 0) return 0;

    await this.prisma.$transaction(async (tx) => {
      await tx.chat.updateMany({
        where: { id: { in: expiredIds } },
        data: { deletedAt: now },
      });
      await tx.chatMessage.updateMany({
        where: { chatId: { in: expiredIds } },
        data: { deletedAt: now },
      });
    });

    return expiredIds.length;
  }

  private computeRetentionEnd(
    chat: {
      type: ChatType;
      course?: { updatedAt: Date } | null;
      assignment?: { date: Date } | null;
      classGroup?: { active: boolean; updatedAt: Date } | null;
      messages: { createdAt: Date }[];
    },
    now: Date
  ): Date | null {
    switch (chat.type) {
      case ChatType.DIRECT:
      case ChatType.GROUP: {
        const lastMessage = chat.messages[0];
        if (!lastMessage) return null;
        return addYears(lastMessage.createdAt, 1);
      }

      case ChatType.COURSE: {
        const course = chat.course;
        if (!course) return null;
        return addYears(course.updatedAt, 2);
      }

      case ChatType.ASSIGNMENT: {
        const assignment = chat.assignment;
        if (!assignment) return null;
        return addYears(addDays(assignment.date, 30), 2);
      }

      case ChatType.CLASS_GROUP: {
        const classGroup = chat.classGroup;
        if (!classGroup) return null;
        if (classGroup.active) return null;
        return addYears(classGroup.updatedAt, 2);
      }

      default:
        return null;
    }
  }
}
