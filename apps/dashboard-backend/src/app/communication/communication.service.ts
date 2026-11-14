import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  DeliveryChannel,
  DeliveryStatus,
  Prisma,
  ThreadStatus,
  ThreadType,
  UrgencyTier,
} from '@generated/prisma';
import { PrismaService } from '../prisma.service';
import { CommunicationDeliveryService } from './communication-delivery.service';
import { CommunicationSocketGateway } from './communication-socket.gateway';
import { TranslationService } from './translation.service';
import {
  AddParticipantInput,
  BroadcastInput,
  CreateThreadInput,
  DeliveryPreviewInput,
  PreferenceInput,
  SendMessageInput,
  SubscriberSyncInput,
  UpdateBroadcastInput,
} from './dto/communication.input';

const THREAD_INCLUDE = {
  participants: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    where: { deletedAt: null },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const;

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, firstName: true, lastName: true, role: true } },
} as const;

@Injectable({ scope: Scope.REQUEST })
export class CommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: CommunicationDeliveryService,
    private readonly translation: TranslationService,
    private readonly gateway: CommunicationSocketGateway,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private getAuth() {
    const req = this.request;
    const user = req.user as {
      userId: string;
      organizationId: string | null;
      role: string;
    };
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    return user;
  }

  private isStaff(role: string): boolean {
    return ['TEACHER', 'ORG_ADMIN', 'ADMIN', 'SYSADMIN'].includes(role.toUpperCase());
  }

  private isOrgAdmin(role: string): boolean {
    return ['ORG_ADMIN', 'ADMIN', 'SYSADMIN'].includes(role.toUpperCase());
  }

  private async audit(params: {
    actorId: string | null;
    organizationId: string | null;
    action: string;
    threadId?: string;
    messageId?: string;
    detail?: Record<string, unknown>;
    ip?: string;
  }) {
    await this.prisma.communicationAuditLog
      .create({
        data: {
          actorId: params.actorId,
          organizationId: params.organizationId,
          action: params.action,
          threadId: params.threadId,
          messageId: params.messageId,
          detail: params.detail ? JSON.stringify(params.detail) : null,
          ip: params.ip,
        },
      })
      .catch(() => undefined);
  }

  // ── Roster derivation ────────────────────────────────────────────────────

  private async resolveRecipients(
    type: ThreadType,
    scopeId: string | null | undefined,
    organizationId: string,
    explicitUserIds?: string[],
  ): Promise<string[]> {
    if (type === ThreadType.DIRECT) {
      if (!explicitUserIds || explicitUserIds.length === 0) {
        throw new BadRequestException('DIRECT threads require participantUserIds');
      }
      return [...new Set(explicitUserIds)];
    }

    if (type === ThreadType.STUDENT_GUARDIANS) {
      if (!scopeId) throw new BadRequestException('STUDENT_GUARDIANS requires scopeId');
      const student = await this.prisma.student.findUnique({
        where: { id: scopeId },
        include: {
          user: true,
          parents: { include: { user: true } },
        },
      });
      if (!student) throw new NotFoundException('Student not found');
      const ids = new Set<string>();
      if (student.user?.id) ids.add(student.user.id);
      for (const p of student.parents) if (p.user?.id) ids.add(p.user.id);
      return [...ids];
    }

    const scopeFilter =
      type === ThreadType.CLASS_GROUP
        ? { classGroupId: scopeId }
        : type === ThreadType.COURSE
          ? { courseId: scopeId }
          : null;

    if (scopeFilter && !scopeId) {
      throw new BadRequestException(`${type} requires scopeId`);
    }

    if (type === ThreadType.SCHOOL_WIDE) {
      const studentWhere = scopeId
        ? { organizationId, schoolId: scopeId }
        : { organizationId };
      const [students, teachers] = await Promise.all([
        this.prisma.student.findMany({
          where: studentWhere,
          include: { user: true, parents: { include: { user: true } } },
        }),
        this.prisma.teacher.findMany({
          where: { organizationId },
          include: { user: true },
        }),
      ]);
      const ids = new Set<string>();
      for (const s of students) {
        if (s.user?.id) ids.add(s.user.id);
        for (const p of s.parents) if (p.user?.id) ids.add(p.user.id);
      }
      for (const t of teachers) if (t.user?.id) ids.add(t.user.id);
      return [...ids];
    }

    // CLASS_GROUP or COURSE
    const students = await this.prisma.student.findMany({
      where: { ...scopeFilter, organizationId },
      include: { user: true, parents: { include: { user: true } } },
    });
    const ids = new Set<string>();
    for (const s of students) {
      if (s.user?.id) ids.add(s.user.id);
      for (const p of s.parents) if (p.user?.id) ids.add(p.user.id);
    }
    return [...ids];
  }

  // ── Threads ──────────────────────────────────────────────────────────────

  async createThread(input: CreateThreadInput) {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');

    const recipients = await this.resolveRecipients(
      input.type,
      input.scopeId,
      organizationId,
      input.participantUserIds,
    );

    const participantData: Prisma.ThreadParticipantCreateWithoutThreadInput[] = [
      { user: { connect: { id: userId } }, role: 'OWNER', canInitiate: true },
      ...recipients
        .filter((id) => id !== userId)
        .map((id) => ({ user: { connect: { id } }, role: 'MEMBER', canInitiate: false })),
    ];

    const firstBody = input.body?.trim();
    const urgency = input.urgencyDefault ?? UrgencyTier.ROUTINE;

    const thread = await this.prisma.communicationThread.create({
      data: {
        organizationId,
        type: input.type,
        scopeId: input.scopeId ?? null,
        title: input.title.trim(),
        createdById: userId,
        ownerRole: role.toUpperCase(),
        urgencyDefault: urgency,
        participants: { create: participantData },
        ...(firstBody
          ? {
              messages: {
                create: {
                  senderId: userId,
                  body: firstBody,
                  urgency,
                },
              },
            }
          : {}),
      },
      include: THREAD_INCLUDE,
    });

    await this.audit({
      actorId: userId,
      organizationId,
      action: 'THREAD_CREATED',
      threadId: thread.id,
      detail: { type: input.type, scopeId: input.scopeId, participants: participantData.length },
    });

    const firstMessage = thread.messages[0];
    if (firstMessage) {
      const recipientUserIds = thread.participants.filter((p) => p.userId !== userId).map((p) => p.userId);
      if (recipientUserIds.length > 0) {
        await this.delivery.materializeDeliveries(firstMessage.id, recipientUserIds);
        await this.delivery.fanOut(firstMessage.id);
      }
      this.gateway.emitMessageNew(thread.id, firstMessage, recipientUserIds);
      await this.audit({
        actorId: userId,
        organizationId,
        action: 'MESSAGE_SENT',
        threadId: thread.id,
        messageId: firstMessage.id,
      });
    }

    return thread;
  }

  async listThreads() {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) return [];

    const where: Prisma.CommunicationThreadWhereInput = {
      deletedAt: null,
      OR: [{ participants: { some: { userId } } }],
    };
    // Teachers see only threads they own or sit on (they are always a participant
    // on threads they create). Org-admins may list the whole organization.
    if (this.isOrgAdmin(role)) {
      where.OR!.push({ organizationId });
    } else {
      where.status = { not: ThreadStatus.PENDING_APPROVAL };
    }

    return this.prisma.communicationThread.findMany({
      where,
      include: THREAD_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listRecentBroadcasts(take = 5) {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) return [];
    const limit = Math.min(Math.max(Number.isFinite(take) ? take : 5, 1), 20);

    return this.prisma.communicationThread.findMany({
      where: {
        deletedAt: null,
        broadcast: true,
        status: { not: ThreadStatus.PENDING_APPROVAL },
        ...(this.isOrgAdmin(role)
          ? { organizationId }
          : { participants: { some: { userId } } }),
      },
      include: THREAD_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getThread(id: string) {
    const { userId, organizationId, role } = this.getAuth();
    const thread = await this.prisma.communicationThread.findFirst({
      where: { id, deletedAt: null },
      include: THREAD_INCLUDE,
    });
    if (!thread) throw new NotFoundException('Thread not found');
    const isParticipant = thread.participants.some((p) => p.userId === userId);
    const isAdmin = this.isOrgAdmin(role) && thread.organizationId === organizationId;
    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('Not a participant of this thread');
    }
    if (thread.status === ThreadStatus.PENDING_APPROVAL && !isAdmin && thread.createdById !== userId) {
      throw new ForbiddenException('Broadcast is pending approval');
    }
    return thread;
  }

  async getMessages(threadId: string, cursor?: string, limit = 50) {
    const { userId, organizationId, role } = this.getAuth();
    const thread = await this.prisma.communicationThread.findFirst({
      where: { id: threadId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        status: true,
        createdById: true,
        participants: { select: { userId: true } },
      },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    const isParticipant = thread.participants.some((p) => p.userId === userId);
    const isAdmin = this.isOrgAdmin(role) && thread.organizationId === organizationId;
    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('Not a participant of this thread');
    }
    if (thread.status === ThreadStatus.PENDING_APPROVAL && !isAdmin && thread.createdById !== userId) {
      throw new ForbiddenException('Broadcast is pending approval');
    }

    const messages = await this.prisma.communicationMessage.findMany({
      where: { threadId, deletedAt: null },
      take: Math.min(limit, 100),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: MESSAGE_INCLUDE,
    });
    return messages.reverse();
  }

  async sendMessage(input: SendMessageInput, ip?: string) {
    const { userId, organizationId, role } = this.getAuth();

    const participant = await this.prisma.threadParticipant.findFirst({
      where: { threadId: input.threadId, userId },
    });
    if (!participant) throw new ForbiddenException('Not a participant of this thread');

    const thread = await this.prisma.communicationThread.findUnique({
      where: { id: input.threadId },
      select: {
        id: true,
        broadcast: true,
        status: true,
        organizationId: true,
        repliesAllowed: true,
        createdById: true,
      },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.broadcast && thread.status !== ThreadStatus.APPROVED) {
      throw new ForbiddenException('Broadcast thread is not approved for messaging');
    }
    if (thread.broadcast && !thread.repliesAllowed) {
      const isOwner = thread.createdById === userId || participant.role === 'OWNER';
      if (!isOwner && !this.isOrgAdmin(role)) {
        throw new ForbiddenException('Replies are disabled on this broadcast');
      }
    }

    const message = await this.prisma.communicationMessage.create({
      data: {
        threadId: input.threadId,
        senderId: userId,
        body: input.body.trim(),
        urgency: input.urgency ?? UrgencyTier.ROUTINE,
      },
      include: MESSAGE_INCLUDE,
    });

    const recipientUserIds = (
      await this.prisma.threadParticipant.findMany({
        where: { threadId: input.threadId, userId: { not: userId } },
        select: { userId: true },
      })
    ).map((p) => p.userId);

    if (recipientUserIds.length > 0) {
      await this.delivery.materializeDeliveries(message.id, recipientUserIds);
      await this.delivery.fanOut(message.id);
    }

    this.gateway.emitMessageNew(input.threadId, message, recipientUserIds);

    await this.audit({
      actorId: userId,
      organizationId,
      action: 'MESSAGE_SENT',
      threadId: input.threadId,
      messageId: message.id,
      ip,
    });

    return message;
  }

  async markRead(messageId: string) {
    const { userId } = this.getAuth();
    const message = await this.prisma.communicationMessage.findUnique({
      where: { id: messageId },
      select: { id: true, threadId: true, senderId: true },
    });
    if (!message) throw new NotFoundException('Message not found');

    const readAt = new Date();
    await this.prisma.messageDelivery.updateMany({
      where: { messageId, recipientUserId: userId, channel: DeliveryChannel.IN_APP },
      data: { status: DeliveryStatus.READ, readAt },
    });
    await this.prisma.threadParticipant.updateMany({
      where: { threadId: message.threadId, userId },
      data: { lastReadAt: readAt },
    });

    const payload = {
      messageId,
      recipientUserId: userId,
      channel: DeliveryChannel.IN_APP,
      status: DeliveryStatus.READ,
      readAt: readAt.toISOString(),
    };
    this.gateway.emitDeliveryUpdate(userId, payload);
    if (message.senderId !== userId) {
      this.gateway.emitDeliveryUpdate(message.senderId, payload);
    }

    return { success: true };
  }

  async addParticipants(input: AddParticipantInput) {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');

    const thread = await this.prisma.communicationThread.findFirst({
      where: { id: input.threadId, deletedAt: null },
      select: { id: true, organizationId: true, participants: { select: { userId: true } } },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.organizationId !== organizationId) {
      throw new ForbiddenException('Thread is not in your organization');
    }
    const isParticipant = thread.participants.some((p) => p.userId === userId);
    if (!isParticipant && !this.isOrgAdmin(role)) {
      throw new ForbiddenException('Not a participant of this thread');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: input.userIds }, organizationId },
    });
    if (users.length !== input.userIds.length) {
      throw new BadRequestException('All users must be in your organization');
    }

    const existing = await this.prisma.threadParticipant.findMany({
      where: { threadId: input.threadId, userId: { in: input.userIds } },
    });
    const existingIds = new Set(existing.map((p) => p.userId));
    const toAdd = input.userIds.filter((id) => !existingIds.has(id));

    if (toAdd.length > 0) {
      await this.prisma.threadParticipant.createMany({
        data: toAdd.map((id) => ({
          threadId: input.threadId,
          userId: id,
          role: 'MEMBER',
          canInitiate: false,
          addedById: userId,
        })),
      });
    }

    await this.audit({
      actorId: userId,
      organizationId,
      action: 'PARTICIPANT_ADDED',
      threadId: input.threadId,
      detail: { added: toAdd },
    });

    return this.getThread(input.threadId);
  }

  async emitTyping(threadId: string) {
    const { userId } = this.getAuth();
    this.gateway.emitTyping(threadId, userId);
    return { ok: true };
  }

  // ── Roster endpoints ─────────────────────────────────────────────────────

  async classGroupRecipients(classGroupId: string) {
    const { organizationId } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    const cg = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: {
        students: {
          include: { user: { select: { id: true, firstName: true, lastName: true } }, parents: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
        },
      },
    });
    if (!cg || cg.organizationId !== organizationId) throw new NotFoundException('Class group not found');
    return this.summarizeRecipients(cg.students);
  }

  async studentGuardians(studentId: string) {
    const { organizationId } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        parents: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!student || student.organizationId !== organizationId) throw new NotFoundException('Student not found');
    const guardians = student.parents.map((p) => p.user).filter(Boolean);
    return { student: student.user, guardians };
  }

  private summarizeRecipients(students: { user: { id: string; firstName: string; lastName: string } | null; parents: { user: { id: string; firstName: string; lastName: string } | null }[] }[]) {
    const map = new Map<string, { id: string; firstName: string; lastName: string }>();
    for (const s of students) {
      if (s.user) map.set(s.user.id, s.user);
      for (const p of s.parents) if (p.user) map.set(p.user.id, p.user);
    }
    return [...map.values()];
  }

  // ── Delivery / Novu seam ─────────────────────────────────────────────────

  async syncSubscriber(input: SubscriberSyncInput) {
    const { organizationId } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    return this.prisma.recipientPreference.upsert({
      where: { userId: input.userId },
      update: {
        language: input.language ?? undefined,
        timezone: input.timezone ?? undefined,
        quietHoursStart: input.quietHoursStart ?? undefined,
        quietHoursEnd: input.quietHoursEnd ?? undefined,
        channelPrefs: (input.channelPrefs ?? undefined) as Prisma.InputJsonValue | undefined,
        novuSubscriberId: `novu:${input.userId}:${organizationId}`,
      },
      create: {
        userId: input.userId,
        language: input.language ?? null,
        timezone: input.timezone ?? 'UTC',
        quietHoursStart: input.quietHoursStart ?? null,
        quietHoursEnd: input.quietHoursEnd ?? null,
        channelPrefs: (input.channelPrefs ?? null) as Prisma.InputJsonValue | null,
        novuSubscriberId: `novu:${input.userId}:${organizationId}`,
      },
    });
  }

  async setPreference(userId: string, input: PreferenceInput) {
    const { userId: actorId, organizationId, role } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (userId !== actorId && !this.isOrgAdmin(role)) {
      throw new ForbiddenException('You can only update your own preferences');
    }
    return this.prisma.recipientPreference.upsert({
      where: { userId },
      update: {
        language: input.language ?? undefined,
        timezone: input.timezone ?? undefined,
        quietHoursStart: input.quietHoursStart ?? undefined,
        quietHoursEnd: input.quietHoursEnd ?? undefined,
        channelPrefs: (input.channelPrefs ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      create: {
        userId,
        language: input.language ?? null,
        timezone: input.timezone ?? 'UTC',
        quietHoursStart: input.quietHoursStart ?? null,
        quietHoursEnd: input.quietHoursEnd ?? null,
        channelPrefs: (input.channelPrefs ?? null) as Prisma.InputJsonValue | null,
      },
    });
  }

  async deliveryPreview(input: DeliveryPreviewInput) {
    return this.delivery.preview(input);
  }

  async getDeliveries(messageId: string) {
    return this.prisma.messageDelivery.findMany({
      where: { messageId },
      orderBy: { channel: 'asc' },
    });
  }

  async handleNovuWebhook(payload: unknown, signature?: string) {
    this.delivery.assertWebhookSignature(signature, payload);
    const typed = payload as {
      novuEventId?: string;
      messageId?: string;
      recipientUserId?: string;
      channel?: DeliveryChannel;
      status?: DeliveryStatus;
      deliveredAt?: string;
      readAt?: string;
      failureReason?: string;
    };
    await this.delivery.reconcileWebhook(typed);
    if (typed.recipientUserId) {
      this.gateway.emitDeliveryUpdate(typed.recipientUserId, typed);
    }
    return { ok: true };
  }

  // ── Broadcasts (admin console) ───────────────────────────────────────────

  async createBroadcast(input: BroadcastInput) {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');

    if (
      (input.type === ThreadType.CLASS_GROUP || input.type === ThreadType.COURSE) &&
      !input.scopeId
    ) {
      throw new BadRequestException(`${input.type} requires scopeId`);
    }
    if (input.type === ThreadType.SCHOOL_WIDE && !input.scopeId) {
      throw new BadRequestException('SCHOOL_WIDE requires scopeId (schoolId)');
    }

    if (role.toUpperCase() === 'TEACHER') {
      await this.assertTeacherCanTarget(userId, organizationId, input.type, input.scopeId ?? null);
    }

    const recipients = await this.resolveRecipients(
      input.type,
      input.scopeId,
      organizationId,
    );

    const requiresApproval = !this.isStaff(role) || input.type === ThreadType.SCHOOL_WIDE;
    const status = requiresApproval ? ThreadStatus.PENDING_APPROVAL : ThreadStatus.APPROVED;

    const participantData: Prisma.ThreadParticipantCreateWithoutThreadInput[] = [
      { user: { connect: { id: userId } }, role: 'OWNER', canInitiate: true },
      ...recipients
        .filter((id) => id !== userId)
        .map((id) => ({ user: { connect: { id } }, role: 'MEMBER', canInitiate: false })),
    ];

    const thread = await this.prisma.communicationThread.create({
      data: {
        organizationId,
        type: input.type,
        scopeId: input.scopeId ?? null,
        title: input.title.trim(),
        createdById: userId,
        ownerRole: role.toUpperCase(),
        urgencyDefault: input.urgency ?? UrgencyTier.ROUTINE,
        broadcast: true,
        repliesAllowed: input.repliesAllowed ?? true,
        status,
        participants: { create: participantData },
        messages: {
          create: {
            senderId: userId,
            body: input.body.trim(),
            urgency: input.urgency ?? UrgencyTier.ROUTINE,
          },
        },
      },
      include: THREAD_INCLUDE,
    });

    await this.audit({
      actorId: userId,
      organizationId,
      action: 'BROADCAST_CREATED',
      threadId: thread.id,
      detail: { status, recipients: participantData.length, repliesAllowed: input.repliesAllowed ?? true },
    });

    if (status === ThreadStatus.APPROVED) {
      await this.fanOutThreadMessages(thread.id, userId);
    }

    return thread;
  }

  // ── Teacher broadcast audience (BR-COM-002.7) ───────────────────────────
  // A teacher may target only their own courses, and class groups related to those courses.
  // Courses have no class-group link: a course belongs to a study plan and every class group of
  // that plan takes its courses, so "related" = the group's study plan contains one of the
  // teacher's courses. Being the homeroom teacher (ClassGroup.teacherId) alone does not count.
  // See docs/product/frd/COM-002-broadcasts.md.

  private teacherCourseWhere(teacherId: string): Prisma.CourseWhereInput {
    return { teacherId };
  }

  private teacherClassGroupWhere(teacherId: string): Prisma.ClassGroupWhereInput {
    return { studyPlan: { courses: { some: { teacherId } } } };
  }

  private findTeacher(userId: string, organizationId: string) {
    return this.prisma.teacher.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });
  }

  private async assertTeacherCanTarget(
    userId: string,
    organizationId: string,
    type: ThreadType,
    scopeId: string | null,
  ) {
    if (type !== ThreadType.CLASS_GROUP && type !== ThreadType.COURSE) return;

    const teacher = scopeId ? await this.findTeacher(userId, organizationId) : null;
    let allowed = false;
    if (teacher && scopeId) {
      allowed =
        type === ThreadType.COURSE
          ? (await this.prisma.course.count({
              where: { id: scopeId, organizationId, ...this.teacherCourseWhere(teacher.id) },
            })) > 0
          : (await this.prisma.classGroup.count({
              where: { id: scopeId, organizationId, ...this.teacherClassGroupWhere(teacher.id) },
            })) > 0;
    }

    if (!allowed) {
      throw new ForbiddenException('You can only broadcast to your own groups or courses');
    }
  }

  /** Class groups and courses the caller may target with a broadcast (picker source). */
  async listBroadcastAudiences(schoolId?: string) {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (!this.isStaff(role)) throw new ForbiddenException('Not allowed to create broadcasts');

    const schoolFilter = schoolId ? { schoolId } : {};
    let classGroupWhere: Prisma.ClassGroupWhereInput = { organizationId, ...schoolFilter };
    let courseWhere: Prisma.CourseWhereInput = { organizationId, ...schoolFilter };

    if (!this.isOrgAdmin(role)) {
      const teacher = await this.findTeacher(userId, organizationId);
      if (!teacher) return { classGroups: [], courses: [] };
      classGroupWhere = { ...classGroupWhere, ...this.teacherClassGroupWhere(teacher.id) };
      courseWhere = { ...courseWhere, ...this.teacherCourseWhere(teacher.id) };
    }

    const [classGroups, courses] = await Promise.all([
      this.prisma.classGroup.findMany({
        where: classGroupWhere,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.course.findMany({
        where: courseWhere,
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { classGroups, courses };
  }

  async approveBroadcast(threadId: string) {
    const { userId, organizationId } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    const thread = await this.prisma.communicationThread.findFirst({
      where: { id: threadId, organizationId, deletedAt: null, broadcast: true },
      select: { id: true, status: true, organizationId: true },
    });
    if (!thread) throw new NotFoundException('Broadcast not found');
    if (thread.status !== ThreadStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Broadcast is not pending approval');
    }

    await this.prisma.communicationThread.update({
      where: { id: threadId },
      data: { status: ThreadStatus.APPROVED, approvedById: userId, approvedAt: new Date() },
    });

    await this.fanOutThreadMessages(threadId, userId);

    await this.audit({
      actorId: userId,
      organizationId,
      action: 'BROADCAST_APPROVED',
      threadId,
    });

    return this.getThread(threadId);
  }

  async updateBroadcast(threadId: string, input: UpdateBroadcastInput) {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (input.repliesAllowed === undefined) {
      throw new BadRequestException('No broadcast fields to update');
    }

    const thread = await this.prisma.communicationThread.findFirst({
      where: { id: threadId, organizationId, deletedAt: null, broadcast: true },
      select: { id: true, createdById: true },
    });
    if (!thread) throw new NotFoundException('Broadcast not found');
    if (!this.isOrgAdmin(role) && thread.createdById !== userId) {
      throw new ForbiddenException('Not allowed to update this broadcast');
    }

    await this.prisma.communicationThread.update({
      where: { id: threadId },
      data: { repliesAllowed: input.repliesAllowed },
    });

    await this.audit({
      actorId: userId,
      organizationId,
      action: 'BROADCAST_UPDATED',
      threadId,
      detail: { repliesAllowed: input.repliesAllowed },
    });

    const recipientUserIds = (
      await this.prisma.threadParticipant.findMany({
        where: { threadId, userId: { not: userId } },
        select: { userId: true },
      })
    ).map((p) => p.userId);
    this.gateway.emitThreadUpdated(threadId, { repliesAllowed: input.repliesAllowed }, recipientUserIds);

    return this.getThread(threadId);
  }

  private async fanOutThreadMessages(threadId: string, actorId: string) {
    const messages = await this.prisma.communicationMessage.findMany({
      where: { threadId, deletedAt: null },
      include: MESSAGE_INCLUDE,
    });
    const others = (
      await this.prisma.threadParticipant.findMany({
        where: { threadId, NOT: { userId: actorId } },
        select: { userId: true },
      })
    ).map((p) => p.userId);
    if (others.length === 0) return;

    for (const m of messages) {
      await this.delivery.materializeDeliveries(m.id, others);
      await this.delivery.fanOut(m.id);
      this.gateway.emitMessageNew(threadId, m, others);
    }
  }

  async listBroadcasts(status?: ThreadStatus) {
    const { userId, organizationId, role } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (!this.isOrgAdmin(role) && !this.isStaff(role)) {
      throw new ForbiddenException('Not allowed to list broadcasts');
    }

    return this.prisma.communicationThread.findMany({
      where: {
        organizationId,
        broadcast: true,
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(!this.isOrgAdmin(role) ? { createdById: userId } : {}),
      },
      include: THREAD_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listAudit(limit = 100) {
    const { organizationId } = this.getAuth();
    if (!organizationId) throw new ForbiddenException('Organization context required');
    return this.prisma.communicationAuditLog.findMany({
      where: { organizationId },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
