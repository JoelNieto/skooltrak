import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/** BR-COM-003.11: an assignment's Q&A channel closes this many days after its latest date. */
export const CLOSE_AFTER_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/** FR-COM-003.17: the pinned opening post. The backfill migration writes the same text. */
export function assignmentQuestionsPost(title: string): string {
  return `Preguntas sobre «${title}». Pregunten aquí; todos ven las respuestas.`;
}

/** BR-COM-003.11: the latest date + 3 days, or null when the assignment has no dates (never closes). */
export function assignmentCloseTime(dates: readonly Date[]): Date | null {
  if (!dates.length) return null;
  const latest = Math.max(...dates.map((d) => d.getTime()));
  return new Date(latest + CLOSE_AFTER_DAYS * DAY_MS);
}

/**
 * COM-003-S02: every assignment's Q&A channel (FR .17, .18). Called by the assignments module when
 * an assignment is created or its dates change; it is the only way an ASSIGNMENT channel is made
 * (BR .10). Students only, students reply, public replies; managers are those of the course.
 */
@Injectable()
export class AssignmentChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the channel and its pinned post if the assignment has none. Idempotent. */
  async ensureFor(assignmentId: string): Promise<{ id: string } | null> {
    const existing = await this.prisma.channel.findUnique({ where: { assignmentId }, select: { id: true } });
    if (existing) return existing;
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        title: true,
        schoolId: true,
        courseId: true,
        course: { select: { organizationId: true } },
        teacher: { select: { userId: true } },
        dates: { select: { date: true } },
      },
    });
    if (!assignment) return null;
    const authorId = assignment.teacher?.userId ?? null;
    try {
      const channel = await this.prisma.$transaction(async (tx) => {
        const created = await tx.channel.create({
          data: {
            organizationId: assignment.course.organizationId,
            scope: 'ASSIGNMENT',
            schoolId: assignment.schoolId,
            courseId: assignment.courseId,
            assignmentId: assignment.id,
            name: assignment.title,
            audienceStudents: true,
            audienceParents: false,
            studentsCanReply: true,
            parentsCanReply: false,
            replyVisibility: 'PUBLIC',
            createdById: authorId,
            closesAt: assignmentCloseTime(assignment.dates.map((d) => d.date)),
          },
          select: { id: true },
        });
        await tx.channelPost.create({
          data: { channelId: created.id, authorId, body: assignmentQuestionsPost(assignment.title), pinned: true },
        });
        return created;
      });
      console.log(`[Channels] assignment channel ${channel.id} created for assignment ${assignment.id}`);
      return channel;
    } catch (e) {
      // Created meanwhile by a concurrent call: assignmentId is unique.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return this.prisma.channel.findUnique({ where: { assignmentId }, select: { id: true } });
      }
      throw e;
    }
  }

  /** FR .18: recomputes when the channel closes after the assignment's dates change. */
  async syncCloseTime(assignmentId: string): Promise<void> {
    const dates = await this.prisma.assignmentDate.findMany({ where: { assignmentId }, select: { date: true } });
    await this.prisma.channel.updateMany({
      where: { assignmentId },
      data: { closesAt: assignmentCloseTime(dates.map((d) => d.date)) },
    });
  }
}
