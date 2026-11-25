import { AuthUserContext } from '@/auth';
import {
  ChannelDetail,
  ChannelPost,
  ChannelReceipt,
  ChannelReplyThread,
  ChannelSummary,
  ChannelTarget,
  CreatableChannelScopeKey,
  personName,
  preview,
  RecentChannelPost,
} from '@/shared';
import { Prisma } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { teacherClassGroupWhere } from '../teachers/teacher-scope';
import {
  audienceMembers,
  isClosed,
  MemberContext,
  memberCanReply,
  memberChannelWhere,
  memberContext,
  MemberKind,
  memberKinds,
  unreadChannelPostCount,
} from './channel-audience';
import { managedChannelWhere, requireStaff, requireUser, StaffCaller, staffCaller } from './communication-access';
import { CreateChannelInput, CreateChannelPostInput, CreateChannelReplyInput, UpdateChannelInput } from './dto/communication.input';
import { countToAnswer, replyAuthor } from './to-answer';

export const CHANNEL_NOT_FOUND = 'Canal no encontrado';
export const POST_NOT_FOUND = 'Publicación no encontrada';
export const ADMIN_LEVEL_ONLY = 'Solo los administradores pueden crear canales de organización, escuela o plan de estudio';
export const TARGET_DENIED = 'Solo puedes crear canales para tus cursos o grupos';
export const TARGET_REQUIRED = 'Selecciona a quién va dirigido el canal';
export const AUDIENCE_REQUIRED = 'El canal debe dirigirse a estudiantes, acudientes o ambos';
export const ARCHIVED = 'El canal está archivado';
export const REPLIES_DISABLED = 'No puedes responder en este canal';
export const NO_CONFIRMATION = 'Esta publicación no requiere confirmación de lectura';
export const THREAD_REQUIRED = 'Indica a qué miembro respondes';

const PERSON = { select: { id: true, name: true, firstName: true, lastName: true } } as const;

const CHANNEL_INCLUDE = {
  organization: { select: { name: true } },
  school: { select: { name: true } },
  studyPlan: { select: { name: true } },
  classGroup: { select: { name: true } },
  course: { select: { name: true } },
  // ASSIGNMENT channels (BR-COM-003.10): the groups that put students in the audience.
  assignment: { select: { title: true, dates: { select: { classGroupId: true } } } },
} satisfies Prisma.ChannelInclude;

type ChannelRow = Prisma.ChannelGetPayload<{ include: typeof CHANNEL_INCLUDE }>;

/** The caller's relation to one channel. */
type Access =
  | { role: 'MANAGER'; channel: ChannelRow; staff: StaffCaller }
  | { role: 'MEMBER'; channel: ChannelRow; kinds: Set<MemberKind> };

const MAX_POSTS = 50;
const MAX_RECENT = 20;

function targetName(c: ChannelRow): string {
  switch (c.scope) {
    case 'ORGANIZATION':
      return c.organization.name;
    case 'SCHOOL':
      return c.school?.name ?? '—';
    case 'STUDY_PLAN':
      return c.studyPlan?.name ?? '—';
    case 'CLASS_GROUP':
      return c.classGroup?.name ?? '—';
    case 'COURSE':
    case 'ASSIGNMENT':
      return c.course?.name ?? '—';
  }
}

const person = (u: { id: string; name: string | null; firstName: string; lastName: string } | null) =>
  u ? { id: u.id, name: personName(u) } : null;

/** COM-003 channels: one-to-many communication with live membership, read counts and confirmations. */
@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Listing ─────────────────────────────────────────────────────────────

  /** FR .11: the channels the caller manages, then the ones they belong to, newest activity first. */
  async list(user: AuthUserContext | undefined): Promise<ChannelSummary[]> {
    const me = requireUser(user);
    const [staff, ctx] = await Promise.all([staffCaller(this.prisma, me), memberContext(this.prisma, me.userId)]);

    const managed = staff
      ? await this.prisma.channel.findMany({ where: managedChannelWhere(staff), include: CHANNEL_INCLUDE })
      : [];
    const managedIds = new Set(managed.map((c) => c.id));
    const memberWhere = memberChannelWhere(ctx);
    const member = memberWhere
      ? (await this.prisma.channel.findMany({ where: memberWhere, include: CHANNEL_INCLUDE })).filter(
          (c) => !managedIds.has(c.id),
        )
      : [];

    const all = [...managed, ...member];
    if (!all.length) return [];
    const ids = all.map((c) => c.id);
    const memberIds = member.map((c) => c.id);
    const [lastPosts, unread, toAnswer] = await Promise.all([
      this.prisma.channelPost.findMany({
        where: { channelId: { in: ids }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        distinct: ['channelId'],
        select: { channelId: true, body: true, createdAt: true },
      }),
      memberIds.length ? this.unreadByChannel(me.userId, memberIds) : Promise.resolve(new Map<string, number>()),
      this.toAnswerByChannel(managed),
    ]);
    const last = new Map(lastPosts.map((p) => [p.channelId, p]));

    return all
      .map((c) =>
        this.summary(c, managedIds.has(c.id) ? 'MANAGER' : 'MEMBER', unread.get(c.id) ?? 0, last.get(c.id), toAnswer.get(c.id)),
      )
      .sort((a, b) => Number(a.archived) - Number(b.archived) || (b.lastPostAt ?? '').localeCompare(a.lastPostAt ?? ''));
  }

  /** FR-COM-003.16: the latest posts across the caller's channels, for home pages. */
  async recent(user: AuthUserContext | undefined, take = 5): Promise<RecentChannelPost[]> {
    const me = requireUser(user);
    const limit = Math.min(Math.max(1, take || 5), MAX_RECENT);
    const [staff, ctx] = await Promise.all([staffCaller(this.prisma, me), memberContext(this.prisma, me.userId)]);
    const or: Prisma.ChannelWhereInput[] = [];
    if (staff) or.push(managedChannelWhere(staff));
    const memberWhere = memberChannelWhere(ctx);
    if (memberWhere) or.push(memberWhere);
    if (!or.length) return [];

    const posts = await this.prisma.channelPost.findMany({
      where: { deletedAt: null, channel: { OR: or } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        body: true,
        createdAt: true,
        requiresConfirmation: true,
        channelId: true,
        authorId: true,
        channel: { select: { name: true } },
        author: PERSON,
        reads: { where: { userId: me.userId }, select: { confirmedAt: true } },
      },
    });
    return posts.map((p) => ({
      id: p.id,
      channelId: p.channelId,
      channelName: p.channel.name,
      body: preview(p.body, 240),
      author: person(p.author),
      createdAt: p.createdAt.toISOString(),
      unread: p.authorId !== me.userId && p.reads.length === 0,
      requiresConfirmation: p.requiresConfirmation,
      confirmed: !!p.reads[0]?.confirmedAt,
    }));
  }

  /** FR .15: unread posts across the channels the caller belongs to. */
  async unreadCount(user: AuthUserContext | undefined): Promise<number> {
    return unreadChannelPostCount(this.prisma, requireUser(user).userId);
  }

  /** BR .2: what the caller may target at a level, for the create form. */
  async targets(user: AuthUserContext | undefined, scope: CreatableChannelScopeKey, schoolId?: string): Promise<ChannelTarget[]> {
    const staff = await requireStaff(this.prisma, user);
    const org = staff.organizationId;
    const school = schoolId ? { schoolId } : {};
    if (scope === 'ORGANIZATION') return [];
    if (!staff.admin && (scope === 'SCHOOL' || scope === 'STUDY_PLAN')) return [];
    switch (scope) {
      case 'SCHOOL':
        return (
          await this.prisma.school.findMany({ where: { organizationId: org }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
        ).map((s) => ({ id: s.id, name: s.name, context: null }));
      case 'STUDY_PLAN':
        return (
          await this.prisma.studyPlan.findMany({
            where: { school: { organizationId: org }, ...school },
            select: { id: true, name: true, school: { select: { name: true } } },
            orderBy: [{ level: 'asc' }, { name: 'asc' }],
          })
        ).map((p) => ({ id: p.id, name: p.name, context: p.school.name }));
      case 'CLASS_GROUP': {
        const where: Prisma.ClassGroupWhereInput = {
          organizationId: org,
          active: true,
          ...school,
          ...(staff.admin ? {} : staff.teacherId ? teacherClassGroupWhere(staff.teacherId) : { id: { in: [] } }),
        };
        return (
          await this.prisma.classGroup.findMany({
            where,
            select: { id: true, name: true, school: { select: { name: true } } },
            orderBy: { name: 'asc' },
          })
        ).map((g) => ({ id: g.id, name: g.name, context: g.school.name }));
      }
      case 'COURSE': {
        const where: Prisma.CourseWhereInput = {
          organizationId: org,
          ...school,
          ...(staff.admin ? {} : { teacherId: staff.teacherId ?? '' }),
        };
        return (
          await this.prisma.course.findMany({
            where,
            select: { id: true, name: true, studyPlan: { select: { name: true } } },
            orderBy: { name: 'asc' },
          })
        ).map((c) => ({ id: c.id, name: c.name, context: c.studyPlan.name }));
      }
    }
  }

  // ── Managing ────────────────────────────────────────────────────────────

  /** FR .1–.4, BR .1 / .2. */
  async create(user: AuthUserContext | undefined, input: CreateChannelInput): Promise<ChannelSummary> {
    const staff = await requireStaff(this.prisma, user);
    if (!input.audienceStudents && !input.audienceParents) throw new BadRequestException(AUDIENCE_REQUIRED);
    const target = await this.resolveTarget(staff, input.scope, input.targetId);

    const channel = await this.prisma.channel.create({
      data: {
        organizationId: staff.organizationId,
        scope: input.scope,
        ...target,
        name: input.name.trim(),
        description: input.description?.trim() ?? '',
        audienceStudents: input.audienceStudents,
        audienceParents: input.audienceParents,
        studentsCanReply: input.audienceStudents && !!input.studentsCanReply,
        parentsCanReply: input.audienceParents && !!input.parentsCanReply,
        replyVisibility: input.replyVisibility ?? 'PRIVATE',
        createdById: staff.userId,
      },
      include: CHANNEL_INCLUDE,
    });
    console.log(`[Channels] channel ${channel.id} (${channel.scope}) created by user ${staff.userId}`);
    return this.summary(channel, 'MANAGER', 0, undefined);
  }

  /** FR .5. Level and target never change. */
  async update(user: AuthUserContext | undefined, channelId: string, input: UpdateChannelInput): Promise<ChannelSummary> {
    const { channel } = await this.manage(user, channelId);
    const audienceStudents = input.audienceStudents ?? channel.audienceStudents;
    const audienceParents = input.audienceParents ?? channel.audienceParents;
    if (!audienceStudents && !audienceParents) throw new BadRequestException(AUDIENCE_REQUIRED);
    const updated = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        audienceStudents,
        audienceParents,
        studentsCanReply: audienceStudents && (input.studentsCanReply ?? channel.studentsCanReply),
        parentsCanReply: audienceParents && (input.parentsCanReply ?? channel.parentsCanReply),
        ...(input.replyVisibility ? { replyVisibility: input.replyVisibility } : {}),
        ...(input.archived !== undefined ? { archivedAt: input.archived ? (channel.archivedAt ?? new Date()) : null } : {}),
      },
      include: CHANNEL_INCLUDE,
    });
    return this.summary(updated, 'MANAGER', 0, undefined);
  }

  /** FR .6. */
  async createPost(user: AuthUserContext | undefined, channelId: string, input: CreateChannelPostInput): Promise<ChannelPost> {
    const { channel, staff } = await this.manage(user, channelId);
    if (isClosed(channel)) throw new ForbiddenException(ARCHIVED);
    const post = await this.prisma.channelPost.create({
      data: {
        channelId,
        authorId: staff.userId,
        body: input.body.trim(),
        requiresConfirmation: !!input.requiresConfirmation,
      },
      include: { author: PERSON },
    });
    const audience = await audienceMembers(this.prisma, channel);
    return this.toPost(post, null, 0, { audience: audience.size, read: 0, confirmed: 0 });
  }

  async deletePost(user: AuthUserContext | undefined, channelId: string, postId: string): Promise<{ id: string }> {
    await this.manage(user, channelId);
    await this.findPost(channelId, postId);
    await this.prisma.channelPost.update({ where: { id: postId }, data: { deletedAt: new Date() } });
    return { id: postId };
  }

  /** FR .9: every audience member with when they read and confirmed. */
  async receipts(user: AuthUserContext | undefined, channelId: string, postId: string): Promise<ChannelReceipt[]> {
    const { channel } = await this.manage(user, channelId);
    await this.findPost(channelId, postId);
    const audience = await audienceMembers(this.prisma, channel);
    const reads = await this.prisma.channelPostRead.findMany({
      where: { postId, userId: { in: [...audience.keys()] } },
      select: { userId: true, readAt: true, confirmedAt: true },
    });
    const byUser = new Map(reads.map((r) => [r.userId, r]));
    return [...audience.values()]
      .map((m) => {
        const r = byUser.get(m.userId);
        return {
          user: { id: m.userId, name: m.name },
          kind: m.kind,
          students: m.students,
          readAt: r?.readAt.toISOString() ?? null,
          confirmedAt: r?.confirmedAt?.toISOString() ?? null,
        };
      })
      .sort((a, b) => a.user.name.localeCompare(b.user.name, 'es'));
  }

  // ── Reading ─────────────────────────────────────────────────────────────

  /** FR .7 / .9: the channel with its latest posts; stats for managers, own receipts for members. */
  async get(user: AuthUserContext | undefined, channelId: string): Promise<ChannelDetail> {
    const me = requireUser(user);
    const access = await this.access(me, channelId);
    const { channel } = access;
    const manager = access.role === 'MANAGER';

    const posts = await this.prisma.channelPost.findMany({
      where: { channelId, deletedAt: null },
      // FR-COM-003.17: an assignment channel's opening post comes first.
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: MAX_POSTS,
      include: {
        author: PERSON,
        reads: { where: { userId: me.userId }, select: { readAt: true, confirmedAt: true } },
      },
    });
    const postIds = posts.map((p) => p.id);

    const replyWhere: Prisma.ChannelReplyWhereInput = {
      postId: { in: postIds },
      deletedAt: null,
      ...(!manager && channel.replyVisibility === 'PRIVATE' ? { threadUserId: me.userId } : {}),
    };
    const replyCounts = postIds.length
      ? await this.prisma.channelReply.groupBy({ by: ['postId'], where: replyWhere, _count: { _all: true } })
      : [];
    const repliesBy = new Map(replyCounts.map((r) => [r.postId, r._count._all]));

    let stats: Map<string, { audience: number; read: number; confirmed: number }> | null = null;
    if (manager && postIds.length) {
      const audience = await audienceMembers(this.prisma, channel);
      const userIds = [...audience.keys()];
      const [read, confirmed] = await Promise.all([
        this.prisma.channelPostRead.groupBy({
          by: ['postId'],
          where: { postId: { in: postIds }, userId: { in: userIds } },
          _count: { _all: true },
        }),
        this.prisma.channelPostRead.groupBy({
          by: ['postId'],
          where: { postId: { in: postIds }, userId: { in: userIds }, confirmedAt: { not: null } },
          _count: { _all: true },
        }),
      ]);
      const readBy = new Map(read.map((r) => [r.postId, r._count._all]));
      const confBy = new Map(confirmed.map((r) => [r.postId, r._count._all]));
      stats = new Map(
        postIds.map((id) => [id, { audience: audience.size, read: readBy.get(id) ?? 0, confirmed: confBy.get(id) ?? 0 }]),
      );
    }

    const unread = manager ? 0 : posts.filter((p) => p.reads.length === 0 && p.authorId !== me.userId).length;
    const canReply = manager ? !isClosed(channel) : memberCanReply(channel, access.kinds);
    return {
      ...this.summary(channel, access.role, unread, posts[0], manager ? (await this.toAnswerByChannel([channel])).get(channel.id) : 0),
      canReply,
      posts: posts.map((p) => this.toPost(p, p.reads[0] ?? null, repliesBy.get(p.id) ?? 0, stats?.get(p.id) ?? null)),
    };
  }

  /** FR .8: opening a channel marks its posts read (members only). */
  async markRead(user: AuthUserContext | undefined, channelId: string): Promise<{ marked: number }> {
    const me = requireUser(user);
    const access = await this.access(me, channelId);
    if (access.role === 'MANAGER') return { marked: 0 };
    const unread = await this.prisma.channelPost.findMany({
      where: { channelId, deletedAt: null, reads: { none: { userId: me.userId } } },
      select: { id: true },
    });
    if (!unread.length) return { marked: 0 };
    const result = await this.prisma.channelPostRead.createMany({
      data: unread.map((p) => ({ postId: p.id, userId: me.userId })),
      skipDuplicates: true,
    });
    return { marked: result.count };
  }

  /** FR .8 / BR .6: confirm reading a post that asks for it. Can't be undone. */
  async confirm(user: AuthUserContext | undefined, channelId: string, postId: string): Promise<{ confirmedAt: string }> {
    const me = requireUser(user);
    const access = await this.access(me, channelId);
    if (access.role === 'MANAGER') throw new ForbiddenException('Solo los miembros del canal confirman la lectura');
    const post = await this.findPost(channelId, postId);
    if (!post.requiresConfirmation) throw new BadRequestException(NO_CONFIRMATION);
    const existing = await this.prisma.channelPostRead.findUnique({
      where: { postId_userId: { postId, userId: me.userId } },
      select: { confirmedAt: true },
    });
    if (existing?.confirmedAt) return { confirmedAt: existing.confirmedAt.toISOString() };
    const now = new Date();
    await this.prisma.channelPostRead.upsert({
      where: { postId_userId: { postId, userId: me.userId } },
      create: { postId, userId: me.userId, readAt: now, confirmedAt: now },
      update: { confirmedAt: now },
    });
    return { confirmedAt: now.toISOString() };
  }

  /** FR .10 / BR .5: the replies the caller may see, grouped by member in PRIVATE channels. */
  async replies(
    user: AuthUserContext | undefined,
    channelId: string,
    postId: string,
    memberUserId?: string,
  ): Promise<ChannelReplyThread[]> {
    const me = requireUser(user);
    const access = await this.access(me, channelId);
    await this.findPost(channelId, postId);
    const { channel } = access;
    const manager = access.role === 'MANAGER';
    const isPrivate = channel.replyVisibility === 'PRIVATE';

    const where: Prisma.ChannelReplyWhereInput = { postId, deletedAt: null };
    if (isPrivate) {
      if (!manager) where.threadUserId = me.userId;
      else if (memberUserId) where.threadUserId = memberUserId;
    }
    const rows = await this.prisma.channelReply.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { author: PERSON, threadUser: PERSON },
    });
    const managerIds = await this.managerIdsAmong(channel, [...new Set(rows.map((r) => r.authorId).filter(Boolean) as string[])]);
    const toReply = (r: (typeof rows)[number]) => ({
      id: r.id,
      body: r.body,
      author: person(r.author),
      fromManager: !!r.authorId && managerIds.has(r.authorId),
      createdAt: r.createdAt.toISOString(),
    });

    if (!isPrivate) return [{ member: null, replies: rows.map(toReply) }];
    const threads = new Map<string, ChannelReplyThread>();
    for (const r of rows) {
      // Replies written before the channel turned PRIVATE have no thread: they belong to their author.
      const key = r.threadUserId ?? r.authorId ?? 'unknown';
      const owner = r.threadUser ?? r.author;
      const thread = threads.get(key) ?? { member: person(owner), replies: [] };
      thread.replies.push(toReply(r));
      threads.set(key, thread);
    }
    return [...threads.values()].sort(
      (a, b) => (b.replies[b.replies.length - 1]?.createdAt ?? '').localeCompare(a.replies[a.replies.length - 1]?.createdAt ?? ''),
    );
  }

  /** FR .10 / BR .5. */
  async reply(
    user: AuthUserContext | undefined,
    channelId: string,
    postId: string,
    input: CreateChannelReplyInput,
  ): Promise<ChannelReplyThread> {
    const me = requireUser(user);
    const access = await this.access(me, channelId);
    await this.findPost(channelId, postId);
    const { channel } = access;
    if (isClosed(channel)) throw new ForbiddenException(ARCHIVED);
    const isPrivate = channel.replyVisibility === 'PRIVATE';

    let threadUserId: string | null = null;
    if (access.role === 'MANAGER') {
      if (isPrivate) {
        if (!input.threadUserId) throw new BadRequestException(THREAD_REQUIRED);
        const audience = await audienceMembers(this.prisma, channel);
        if (!audience.has(input.threadUserId)) throw new BadRequestException(THREAD_REQUIRED);
        threadUserId = input.threadUserId;
      }
    } else {
      if (!memberCanReply(channel, access.kinds)) throw new ForbiddenException(REPLIES_DISABLED);
      threadUserId = isPrivate ? me.userId : null;
    }

    await this.prisma.channelReply.create({
      data: { postId, authorId: me.userId, threadUserId, body: input.body.trim() },
    });
    const threads = await this.replies(me, channelId, postId, threadUserId ?? undefined);
    return isPrivate
      ? (threads.find((t) => t.member?.id === threadUserId) ?? { member: null, replies: [] })
      : threads[0];
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private summary(
    c: ChannelRow,
    role: 'MANAGER' | 'MEMBER',
    unread: number,
    last: { body: string; createdAt: Date } | undefined,
    toAnswer = 0,
  ): ChannelSummary {
    return {
      id: c.id,
      scope: c.scope,
      targetName: targetName(c),
      schoolId: c.schoolId,
      studyPlanId: c.studyPlanId,
      classGroupId: c.classGroupId,
      courseId: c.courseId,
      assignmentId: c.assignmentId,
      closesAt: c.closesAt?.toISOString() ?? null,
      name: c.name,
      description: c.description,
      audienceStudents: c.audienceStudents,
      audienceParents: c.audienceParents,
      studentsCanReply: c.studentsCanReply,
      parentsCanReply: c.parentsCanReply,
      replyVisibility: c.replyVisibility,
      archived: isClosed(c),
      role,
      unread,
      toAnswer: role === 'MANAGER' ? toAnswer : 0,
      lastPostAt: last?.createdAt.toISOString() ?? null,
      lastPostPreview: last ? preview(last.body) : null,
    };
  }

  private toPost(
    p: {
      id: string;
      body: string;
      createdAt: Date;
      requiresConfirmation: boolean;
      pinned: boolean;
      author: { id: string; name: string | null; firstName: string; lastName: string } | null;
    },
    read: { readAt: Date; confirmedAt: Date | null } | null,
    replyCount: number,
    stats: { audience: number; read: number; confirmed: number } | null,
  ): ChannelPost {
    return {
      id: p.id,
      body: p.body,
      author: person(p.author),
      createdAt: p.createdAt.toISOString(),
      requiresConfirmation: p.requiresConfirmation,
      pinned: p.pinned,
      readAt: read?.readAt.toISOString() ?? null,
      confirmedAt: read?.confirmedAt?.toISOString() ?? null,
      replyCount,
      stats,
    };
  }

  /**
   * FR-COM-003.19, BR .12: replies waiting for a manager, per open channel the caller manages. One
   * query for every channel's replies, counted in memory (`countToAnswer`).
   */
  private async toAnswerByChannel(channels: ChannelRow[]): Promise<Map<string, number>> {
    const open = channels.filter((c) => !isClosed(c));
    if (!open.length) return new Map();
    const rows = await this.prisma.channelReply.findMany({
      where: { deletedAt: null, post: { deletedAt: null, channelId: { in: open.map((c) => c.id) } } },
      orderBy: { createdAt: 'asc' },
      select: {
        postId: true,
        authorId: true,
        threadUserId: true,
        post: { select: { channelId: true } },
        author: { select: { role: { select: { name: true } } } },
      },
    });
    return countToAnswer(
      open,
      rows.map((r) => ({
        channelId: r.post.channelId,
        postId: r.postId,
        threadUserId: r.threadUserId,
        authorId: r.authorId,
        author: replyAuthor(r.author?.role?.name, !!r.author),
      })),
    );
  }

  private async unreadByChannel(userId: string, channelIds: string[]): Promise<Map<string, number>> {
    const rows = await this.prisma.channelPost.groupBy({
      by: ['channelId'],
      where: {
        channelId: { in: channelIds },
        deletedAt: null,
        authorId: { not: userId },
        reads: { none: { userId } },
      },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.channelId, r._count._all]));
  }

  /** BR .3 / .4: manager if the caller could create it, member if in its audience; 404 otherwise. */
  private async access(me: AuthUserContext, channelId: string): Promise<Access> {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId }, include: CHANNEL_INCLUDE });
    if (!channel) throw new NotFoundException(CHANNEL_NOT_FOUND);
    const staff = await staffCaller(this.prisma, me);
    if (staff && (await this.manages(staff, channelId))) return { role: 'MANAGER', channel, staff };
    const ctx: MemberContext = await memberContext(this.prisma, me.userId);
    const kinds = memberKinds(channel, ctx);
    if (!kinds.size) throw new NotFoundException(CHANNEL_NOT_FOUND);
    return { role: 'MEMBER', channel, kinds };
  }

  private async manage(user: AuthUserContext | undefined, channelId: string) {
    const staff = await requireStaff(this.prisma, user);
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId }, include: CHANNEL_INCLUDE });
    if (!channel || channel.organizationId !== staff.organizationId) throw new NotFoundException(CHANNEL_NOT_FOUND);
    if (!(await this.manages(staff, channelId))) throw new ForbiddenException(TARGET_DENIED);
    return { channel, staff };
  }

  private async manages(staff: StaffCaller, channelId: string): Promise<boolean> {
    return (await this.prisma.channel.count({ where: { AND: [{ id: channelId }, managedChannelWhere(staff)] } })) > 0;
  }

  /** Which of these users manage the channel: its organization's admins, or teachers per BR .2. */
  private async managerIdsAmong(channel: ChannelRow, userIds: string[]): Promise<Set<string>> {
    if (!userIds.length) return new Set();
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, organizationId: true, role: { select: { name: true } }, teacher: { select: { id: true } } },
    });
    const result = new Set<string>();
    for (const u of users) {
      const role = u.role?.name?.toUpperCase() ?? '';
      if (!role || role === 'PARENT' || role === 'STUDENT' || u.organizationId !== channel.organizationId) continue;
      if (role !== 'TEACHER') {
        result.add(u.id);
        continue;
      }
      const staff: StaffCaller = { userId: u.id, organizationId: channel.organizationId, admin: false, teacherId: u.teacher?.id ?? null };
      if (await this.manages(staff, channel.id)) result.add(u.id);
    }
    return result;
  }

  private async findPost(channelId: string, postId: string) {
    const post = await this.prisma.channelPost.findFirst({
      where: { id: postId, channelId, deletedAt: null },
      select: { id: true, requiresConfirmation: true },
    });
    if (!post) throw new NotFoundException(POST_NOT_FOUND);
    return post;
  }

  /** BR .2: the target exists in the caller's organization and the caller may address it. */
  private async resolveTarget(
    staff: StaffCaller,
    scope: CreatableChannelScopeKey,
    targetId: string | undefined,
  ): Promise<Pick<Prisma.ChannelUncheckedCreateInput, 'schoolId' | 'studyPlanId' | 'classGroupId' | 'courseId'>> {
    const org = staff.organizationId;
    if (scope === 'ORGANIZATION') {
      if (!staff.admin) throw new ForbiddenException(ADMIN_LEVEL_ONLY);
      return {};
    }
    if (!targetId) throw new BadRequestException(TARGET_REQUIRED);
    if (!staff.admin && (scope === 'SCHOOL' || scope === 'STUDY_PLAN')) throw new ForbiddenException(ADMIN_LEVEL_ONLY);

    switch (scope) {
      case 'SCHOOL': {
        const school = await this.prisma.school.findFirst({ where: { id: targetId, organizationId: org }, select: { id: true } });
        if (!school) throw new NotFoundException(TARGET_REQUIRED);
        return { schoolId: school.id };
      }
      case 'STUDY_PLAN': {
        const plan = await this.prisma.studyPlan.findFirst({
          where: { id: targetId, school: { organizationId: org } },
          select: { id: true, schoolId: true },
        });
        if (!plan) throw new NotFoundException(TARGET_REQUIRED);
        return { schoolId: plan.schoolId, studyPlanId: plan.id };
      }
      case 'CLASS_GROUP': {
        const group = await this.prisma.classGroup.findFirst({
          where: {
            id: targetId,
            organizationId: org,
            ...(staff.admin ? {} : teacherClassGroupWhere(staff.teacherId ?? '')),
          },
          select: { id: true, schoolId: true },
        });
        if (!group) {
          if (staff.admin) throw new NotFoundException(TARGET_REQUIRED);
          throw new ForbiddenException(TARGET_DENIED);
        }
        return { schoolId: group.schoolId, classGroupId: group.id };
      }
      case 'COURSE': {
        const course = await this.prisma.course.findFirst({
          where: { id: targetId, organizationId: org },
          select: { id: true, schoolId: true, teacherId: true },
        });
        if (!course) throw new NotFoundException(TARGET_REQUIRED);
        if (!staff.admin && (!staff.teacherId || course.teacherId !== staff.teacherId))
          throw new ForbiddenException(TARGET_DENIED);
        return { schoolId: course.schoolId, courseId: course.id };
      }
    }
  }
}
