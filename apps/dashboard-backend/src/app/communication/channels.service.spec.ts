import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { memberCanReply, memberChannelWhere, MemberContext, memberKinds } from './channel-audience';
import {
  ADMIN_LEVEL_ONLY,
  ARCHIVED,
  AUDIENCE_REQUIRED,
  CHANNEL_NOT_FOUND,
  ChannelsService,
  NO_CONFIRMATION,
  REPLIES_DISABLED,
  TARGET_DENIED,
} from './channels.service';
import { STAFF_ONLY } from './communication-access';

/**
 * COM-003 channels. Org org-1 has school S1, plan P1, group G1 (plan P1) and course C1 (plan P1),
 * taught by teacher T1 (user u-teacher). Student st-1 (user u-student) is in G1 and on C1's roster;
 * u-parent is their parent.
 */
const user = (userId: string, role: string, organizationId = 'org-1') => ({ userId, role, organizationId }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const teacher = user('u-teacher', 'TEACHER');
const parent = user('u-parent', 'PARENT');
const student = user('u-student', 'STUDENT');

const placement = { organizationId: 'org-1', schoolId: 'S1', classGroup: { studyPlanId: 'P1' }, classGroupId: 'G1', courseEnrollments: [{ courseId: 'C1' }] };

const channel = (over: Record<string, unknown> = {}) => ({
  id: 'CH1',
  organizationId: 'org-1',
  scope: 'CLASS_GROUP',
  schoolId: 'S1',
  studyPlanId: null,
  classGroupId: 'G1',
  courseId: null,
  name: '6.° A',
  description: '',
  audienceStudents: true,
  audienceParents: true,
  studentsCanReply: false,
  parentsCanReply: true,
  replyVisibility: 'PRIVATE',
  archivedAt: null,
  createdById: 'u-teacher',
  organization: { name: 'Org' },
  school: { name: 'Escuela' },
  studyPlan: null,
  classGroup: { name: '6.° A' },
  course: null,
  ...over,
});

function setup(opts: { channel?: ReturnType<typeof channel> | null; manages?: boolean; post?: Record<string, unknown> | null } = {}) {
  const ch = opts.channel === undefined ? channel() : opts.channel;
  const created: unknown[] = [];
  const replies: unknown[] = [];
  const reads: unknown[] = [];
  const prisma = {
    teacher: { findFirst: jest.fn(async ({ where }) => (where.userId === 'u-teacher' ? { id: 'T1' } : null)) },
    student: {
      findMany: jest.fn(async ({ where }) => {
        if (where.userId === 'u-student') return [placement];
        if (where.parents?.some?.userId === 'u-parent') return [placement];
        return [];
      }),
    },
    parent: { findMany: jest.fn(async () => []) },
    school: { findFirst: jest.fn(async ({ where }) => (where.id === 'S1' ? { id: 'S1' } : null)) },
    studyPlan: { findFirst: jest.fn(async () => ({ id: 'P1', schoolId: 'S1' })) },
    classGroup: {
      findFirst: jest.fn(async ({ where }) =>
        where.id === 'G1' && (!where.studyPlan || where.studyPlan.courses.some.teacherId === 'T1') ? { id: 'G1', schoolId: 'S1' } : null,
      ),
    },
    course: {
      findFirst: jest.fn(async ({ where }) =>
        where.id === 'C1' ? { id: 'C1', schoolId: 'S1', teacherId: 'T1' } : where.id === 'C2' ? { id: 'C2', schoolId: 'S1', teacherId: 'T9' } : null,
      ),
    },
    channel: {
      findUnique: jest.fn(async () => ch),
      count: jest.fn(async () => (opts.manages ? 1 : 0)),
      create: jest.fn(async ({ data }) => {
        created.push(data);
        return { ...channel(), ...data, id: 'NEW' };
      }),
    },
    channelPost: {
      findFirst: jest.fn(async () => (opts.post === undefined ? { id: 'POST1', requiresConfirmation: true } : opts.post)),
    },
    channelPostRead: {
      findUnique: jest.fn(async () => null),
      upsert: jest.fn(async (args) => reads.push(args)),
    },
    channelReply: {
      create: jest.fn(async ({ data }) => replies.push(data)),
      findMany: jest.fn(async () => []),
    },
    user: { findMany: jest.fn(async () => []) },
  };
  return { service: new ChannelsService(prisma as never), prisma, created, replies, reads };
}

const input = (over: Record<string, unknown> = {}) =>
  ({ scope: 'CLASS_GROUP', targetId: 'G1', name: 'Avisos', audienceStudents: true, audienceParents: true, ...over }) as never;

describe('ChannelsService (COM-003)', () => {
  describe('creating', () => {
    it('refuses parents and students @BR-COM-003.1', async () => {
      const { service } = setup();
      await expect(service.create(parent, input())).rejects.toThrow(new ForbiddenException(STAFF_ONLY));
      await expect(service.create(student, input())).rejects.toThrow(new ForbiddenException(STAFF_ONLY));
    });

    it('keeps organization, school and plan channels for admins @BR-COM-003.2', async () => {
      const { service } = setup();
      for (const scope of ['ORGANIZATION', 'SCHOOL', 'STUDY_PLAN']) {
        await expect(service.create(teacher, input({ scope, targetId: 'S1' }))).rejects.toThrow(
          new ForbiddenException(ADMIN_LEVEL_ONLY),
        );
      }
      await expect(service.create(admin, input({ scope: 'ORGANIZATION', targetId: undefined }))).resolves.toEqual(
        expect.objectContaining({ role: 'MANAGER' }),
      );
    });

    it("lets a teacher target their own course and related group, never someone else's @BR-COM-003.2", async () => {
      const { service, created } = setup();
      await service.create(teacher, input({ scope: 'COURSE', targetId: 'C1' }));
      await service.create(teacher, input({ scope: 'CLASS_GROUP', targetId: 'G1' }));
      expect(created).toEqual([
        expect.objectContaining({ scope: 'COURSE', courseId: 'C1', schoolId: 'S1', organizationId: 'org-1', createdById: 'u-teacher' }),
        expect.objectContaining({ scope: 'CLASS_GROUP', classGroupId: 'G1', schoolId: 'S1' }),
      ]);
      await expect(service.create(teacher, input({ scope: 'COURSE', targetId: 'C2' }))).rejects.toThrow(
        new ForbiddenException(TARGET_DENIED),
      );
    });

    it('needs an audience, and only lets an included audience reply @FR-COM-003.2 @FR-COM-003.3', async () => {
      const { service, created } = setup();
      await expect(
        service.create(admin, input({ audienceStudents: false, audienceParents: false })),
      ).rejects.toThrow(new BadRequestException(AUDIENCE_REQUIRED));
      await service.create(
        admin,
        input({ audienceStudents: false, studentsCanReply: true, parentsCanReply: true, replyVisibility: 'PUBLIC' }),
      );
      expect(created[0]).toEqual(
        expect.objectContaining({ studentsCanReply: false, parentsCanReply: true, replyVisibility: 'PUBLIC' }),
      );
    });
  });

  describe('membership', () => {
    const ctx: MemberContext = {
      userId: 'u-parent',
      asStudent: [],
      asParent: [{ organizationId: 'org-1', schoolId: 'S1', studyPlanId: 'P1', classGroupId: 'G1', courseIds: ['C1'] }],
    };

    it('reaches members through every level of their placement @FR-COM-003.7 @BR-COM-003.4', () => {
      const at = (over: Record<string, unknown>) => memberKinds(channel(over) as never, ctx);
      expect(at({ scope: 'ORGANIZATION' })).toEqual(new Set(['PARENT']));
      expect(at({ scope: 'SCHOOL', schoolId: 'S1' })).toEqual(new Set(['PARENT']));
      expect(at({ scope: 'STUDY_PLAN', studyPlanId: 'P1' })).toEqual(new Set(['PARENT']));
      expect(at({ scope: 'COURSE', courseId: 'C1' })).toEqual(new Set(['PARENT']));
      expect(at({ scope: 'COURSE', courseId: 'C2' })).toEqual(new Set());
      expect(at({ scope: 'CLASS_GROUP', classGroupId: 'G9' })).toEqual(new Set());
      expect(at({ audienceParents: false })).toEqual(new Set());
      expect(at({ organizationId: 'org-2', scope: 'ORGANIZATION' })).toEqual(new Set());
      expect(memberChannelWhere({ userId: 'x', asStudent: [], asParent: [] })).toBeNull();
    });

    it('lets a member reply only when their audience may and the channel is open @BR-COM-003.5', () => {
      const kinds = new Set(['PARENT'] as const);
      expect(memberCanReply(channel() as never, kinds)).toBe(true);
      expect(memberCanReply(channel({ parentsCanReply: false }) as never, kinds)).toBe(false);
      expect(memberCanReply(channel({ archivedAt: new Date() }) as never, kinds)).toBe(false);
      expect(memberCanReply(channel() as never, new Set(['STUDENT'] as const))).toBe(false);
    });

    it('hides a channel from people outside its audience @BR-COM-003.4', async () => {
      const { service } = setup({ channel: channel({ classGroupId: 'G9' }) });
      await expect(service.get(parent, 'CH1')).rejects.toThrow(new NotFoundException(CHANNEL_NOT_FOUND));
    });
  });

  describe('replies and confirmations', () => {
    it('files a private reply under the member, a public one under nobody @FR-COM-003.4 @BR-COM-003.5', async () => {
      const priv = setup();
      await priv.service.reply(parent, 'CH1', 'POST1', { body: ' Gracias ' });
      expect(priv.replies).toEqual([{ postId: 'POST1', authorId: 'u-parent', threadUserId: 'u-parent', body: 'Gracias' }]);

      const pub = setup({ channel: channel({ replyVisibility: 'PUBLIC' }) });
      await pub.service.reply(parent, 'CH1', 'POST1', { body: 'Gracias' });
      expect(pub.replies).toEqual([expect.objectContaining({ threadUserId: null })]);
    });

    it('refuses replies when the audience may not reply or the channel is archived @BR-COM-003.5', async () => {
      await expect(setup().service.reply(student, 'CH1', 'POST1', { body: 'Hola' })).rejects.toThrow(
        new ForbiddenException(REPLIES_DISABLED),
      );
      await expect(
        setup({ channel: channel({ archivedAt: new Date() }) }).service.reply(parent, 'CH1', 'POST1', { body: 'Hola' }),
      ).rejects.toThrow(new ForbiddenException(ARCHIVED));
    });

    it('records a confirmation once, and only on posts that ask for it @FR-COM-003.8 @BR-COM-003.6', async () => {
      const { service, reads } = setup();
      await service.confirm(parent, 'CH1', 'POST1');
      expect(reads).toEqual([
        expect.objectContaining({
          where: { postId_userId: { postId: 'POST1', userId: 'u-parent' } },
          create: expect.objectContaining({ confirmedAt: expect.any(Date) }),
        }),
      ]);
      const plain = setup({ post: { id: 'POST1', requiresConfirmation: false } });
      await expect(plain.service.confirm(parent, 'CH1', 'POST1')).rejects.toThrow(new BadRequestException(NO_CONFIRMATION));
    });
  });

  describe('managing', () => {
    it("refuses a teacher who doesn't manage the channel @BR-COM-003.3", async () => {
      const { service } = setup({ manages: false });
      await expect(service.createPost(teacher, 'CH1', { body: 'Hola' })).rejects.toThrow(
        new ForbiddenException(TARGET_DENIED),
      );
      await expect(service.receipts(teacher, 'CH1', 'POST1')).rejects.toThrow(new ForbiddenException(TARGET_DENIED));
    });

    it("hides another organization's channel from its admins @BR-COM-003.3", async () => {
      const { service } = setup({ manages: true });
      await expect(service.createPost(user('u-admin2', 'ORG_ADMIN', 'org-2'), 'CH1', { body: 'Hola' })).rejects.toThrow(
        new NotFoundException(CHANNEL_NOT_FOUND),
      );
    });

    it('does not post to an archived channel @FR-COM-003.5', async () => {
      const { service } = setup({ manages: true, channel: channel({ archivedAt: new Date() }) });
      await expect(service.createPost(admin, 'CH1', { body: 'Hola' })).rejects.toThrow(new ForbiddenException(ARCHIVED));
    });
  });
});
