import { AuthUserContext } from '@/auth';
import {
  DirectConversationDetail,
  DirectConversationSummary,
  DirectRecipient,
  personName,
  preview,
} from '@/shared';
import { Prisma } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  NO_STUDENTS_DIRECT,
  reachableStudentWhere,
  requireStaff,
  requireUser,
  roleOf,
} from './communication-access';
import { SendDirectMessageInput, StartDirectInput } from './dto/communication.input';

export const CONVERSATION_NOT_FOUND = 'Conversación no encontrada';
export const PARENT_NOT_REACHABLE = 'Solo puedes escribir a acudientes de tus estudiantes';
export const PARENT_NOT_LINKED = 'El acudiente no está vinculado a ese estudiante';

const PERSON = { select: { id: true, name: true, firstName: true, lastName: true } } as const;
const MAX_CONVERSATIONS = 100;
const MAX_MESSAGES = 200;
const MAX_RECIPIENTS = 30;

const CONVERSATION_INCLUDE = {
  staffUser: PERSON,
  parentUser: PERSON,
  student: { select: { id: true, firstName: true, fatherName: true } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, senderId: true, createdAt: true } },
} satisfies Prisma.DirectConversationInclude;

type ConversationRow = Prisma.DirectConversationGetPayload<{ include: typeof CONVERSATION_INCLUDE }>;

/**
 * COM-003 direct messages: one-to-one between staff and a parent. Staff start them, parents reply,
 * students never see them (BR .7–.9).
 */
@Injectable()
export class DirectService {
  constructor(private readonly prisma: PrismaService) {}

  /** FR .14: the caller's conversations, latest activity first. */
  async list(user: AuthUserContext | undefined): Promise<DirectConversationSummary[]> {
    const me = this.requireDirectUser(user);
    const rows = await this.prisma.directConversation.findMany({
      where: { OR: [{ staffUserId: me.userId }, { parentUserId: me.userId }], messages: { some: {} } },
      orderBy: { lastMessageAt: 'desc' },
      take: MAX_CONVERSATIONS,
      include: CONVERSATION_INCLUDE,
    });
    const unread = await Promise.all(rows.map((c) => this.unreadIn(c, me.userId)));
    return rows.map((c, i) => this.summary(c, me.userId, unread[i]));
  }

  /** FR .15. */
  async unreadCount(user: AuthUserContext | undefined): Promise<number> {
    if (!user?.userId || roleOf(user) === 'STUDENT') return 0;
    const rows = await this.prisma.directConversation.findMany({
      where: { OR: [{ staffUserId: user.userId }, { parentUserId: user.userId }] },
      select: { id: true, staffUserId: true, staffLastReadAt: true, parentLastReadAt: true },
    });
    const counts = await Promise.all(rows.map((c) => this.unreadIn(c, user.userId)));
    return counts.reduce((a, b) => a + b, 0);
  }

  /** FR .12 / BR .8: students the caller reaches, each with the parents who have an account. */
  async recipients(user: AuthUserContext | undefined, q?: string): Promise<DirectRecipient[]> {
    const staff = await requireStaff(this.prisma, user);
    const terms = (q ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 4);
    const nameMatch: Prisma.StudentWhereInput[] = terms.map((t) => ({
      OR: [
        { firstName: { contains: t, mode: 'insensitive' } },
        { fatherName: { contains: t, mode: 'insensitive' } },
        { motherName: { contains: t, mode: 'insensitive' } },
        { parents: { some: { OR: [{ firstName: { contains: t, mode: 'insensitive' } }, { fatherName: { contains: t, mode: 'insensitive' } }] } } },
      ],
    }));
    const students = await this.prisma.student.findMany({
      where: { AND: [reachableStudentWhere(staff), { parents: { some: { userId: { not: null } } } }, ...nameMatch] },
      orderBy: [{ fatherName: 'asc' }, { firstName: 'asc' }],
      take: MAX_RECIPIENTS,
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        classGroup: { select: { name: true } },
        parents: { where: { userId: { not: null } }, select: { user: PERSON } },
      },
    });
    return students.map((s) => ({
      student: { id: s.id, name: `${s.firstName} ${s.fatherName}`.trim(), group: s.classGroup?.name ?? null },
      parents: s.parents.flatMap((p) => (p.user ? [{ id: p.user.id, name: personName(p.user) }] : [])),
    }));
  }

  /** FR .12: start or reopen the conversation with a parent (about a child). */
  async start(user: AuthUserContext | undefined, input: StartDirectInput): Promise<DirectConversationDetail> {
    const staff = await requireStaff(this.prisma, user);
    if (input.parentUserId === staff.userId) throw new BadRequestException('No puedes escribirte a ti mismo');
    const reachable = reachableStudentWhere(staff);

    if (input.studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: input.studentId, organizationId: staff.organizationId },
        select: { id: true, parents: { where: { userId: input.parentUserId }, select: { id: true } } },
      });
      if (!student) throw new NotFoundException('Estudiante no encontrado');
      if (!student.parents.length) throw new BadRequestException(PARENT_NOT_LINKED);
      const inReach = await this.prisma.student.count({ where: { AND: [{ id: student.id }, reachable] } });
      if (!inReach) throw new ForbiddenException(PARENT_NOT_REACHABLE);
    } else {
      const parent = await this.prisma.parent.count({
        where: { userId: input.parentUserId, organizationId: staff.organizationId, students: { some: reachable } },
      });
      if (!parent) throw new ForbiddenException(PARENT_NOT_REACHABLE);
    }

    const studentId = input.studentId ?? null;
    const existing = await this.prisma.directConversation.findFirst({
      where: { staffUserId: staff.userId, parentUserId: input.parentUserId, studentId, organizationId: staff.organizationId },
      select: { id: true },
    });
    const id =
      existing?.id ??
      (
        await this.prisma.directConversation.create({
          data: {
            organizationId: staff.organizationId,
            staffUserId: staff.userId,
            parentUserId: input.parentUserId,
            studentId,
          },
          select: { id: true },
        })
      ).id;
    if (input.body?.trim()) await this.send(user, id, { body: input.body });
    return this.get(user, id);
  }

  /** FR .13: the conversation with its messages; opening it marks it read for the caller's side. */
  async get(user: AuthUserContext | undefined, conversationId: string): Promise<DirectConversationDetail> {
    const me = this.requireDirectUser(user);
    const conversation = await this.participantConversation(me.userId, conversationId);
    const side = conversation.staffUserId === me.userId ? 'STAFF' : 'PARENT';
    const now = new Date();
    await this.prisma.directConversation.update({
      where: { id: conversationId },
      data: side === 'STAFF' ? { staffLastReadAt: now } : { parentLastReadAt: now },
    });
    const otherReadAt = side === 'STAFF' ? conversation.parentLastReadAt : conversation.staffLastReadAt;
    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: MAX_MESSAGES,
      include: { sender: PERSON },
    });
    return {
      ...this.summary(conversation, me.userId, 0),
      side,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderId === me.userId,
        sender: m.sender ? { id: m.sender.id, name: personName(m.sender) } : null,
        createdAt: m.createdAt.toISOString(),
        readByCounterpart: m.senderId === me.userId && !!otherReadAt && otherReadAt >= m.createdAt,
      })),
    };
  }

  /** FR .13: either side writes. */
  async send(
    user: AuthUserContext | undefined,
    conversationId: string,
    input: SendDirectMessageInput,
  ): Promise<{ id: string; createdAt: string }> {
    const me = this.requireDirectUser(user);
    const conversation = await this.participantConversation(me.userId, conversationId);
    const body = input.body.trim();
    if (!body) throw new BadRequestException('El mensaje no puede estar vacío');
    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.directMessage.create({ data: { conversationId, senderId: me.userId, body, createdAt: now } }),
      this.prisma.directConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: now,
          ...(conversation.staffUserId === me.userId ? { staffLastReadAt: now } : { parentLastReadAt: now }),
        },
      }),
    ]);
    return { id: message.id, createdAt: message.createdAt.toISOString() };
  }

  // ── Internals ───────────────────────────────────────────────────────────

  /** BR .7: students never reach direct messages, whatever their role was granted. */
  private requireDirectUser(user: AuthUserContext | undefined) {
    const me = requireUser(user);
    if (roleOf(me) === 'STUDENT') throw new ForbiddenException(NO_STUDENTS_DIRECT);
    return me;
  }

  /** BR .9: only the two participants; 404 for anyone else. */
  private async participantConversation(userId: string, id: string): Promise<ConversationRow> {
    const conversation = await this.prisma.directConversation.findFirst({
      where: { id, OR: [{ staffUserId: userId }, { parentUserId: userId }] },
      include: CONVERSATION_INCLUDE,
    });
    if (!conversation) throw new NotFoundException(CONVERSATION_NOT_FOUND);
    return conversation;
  }

  private unreadIn(
    c: { id: string; staffUserId: string; staffLastReadAt: Date | null; parentLastReadAt: Date | null },
    userId: string,
  ): Promise<number> {
    const lastRead = c.staffUserId === userId ? c.staffLastReadAt : c.parentLastReadAt;
    return this.prisma.directMessage.count({
      where: { conversationId: c.id, senderId: { not: userId }, ...(lastRead ? { createdAt: { gt: lastRead } } : {}) },
    });
  }

  private summary(c: ConversationRow, userId: string, unread: number): DirectConversationSummary {
    const counterpart = c.staffUserId === userId ? c.parentUser : c.staffUser;
    const last = c.messages[0];
    return {
      id: c.id,
      counterpart: { id: counterpart.id, name: personName(counterpart) },
      student: c.student ? { id: c.student.id, name: `${c.student.firstName} ${c.student.fatherName}`.trim() } : null,
      lastMessageAt: (last?.createdAt ?? c.lastMessageAt).toISOString(),
      lastMessagePreview: last ? preview(last.body) : null,
      lastFromCounterpart: !!last && last.senderId !== userId,
      unread,
    };
  }
}
