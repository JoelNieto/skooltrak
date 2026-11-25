jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { ChannelsService } from './channels.service';
import { countToAnswer, replyAuthor, ToAnswerReply } from './to-answer';

/** COM-003-S03: "por responder" for managers (FR-COM-003.19, BR-COM-003.12). */
describe('countToAnswer @FR-COM-003.19 @BR-COM-003.12', () => {
  const channels = [
    { id: 'PRIV', replyVisibility: 'PRIVATE' as const },
    { id: 'PUB', replyVisibility: 'PUBLIC' as const },
  ];
  const member = (
    channelId: string,
    postId: string,
    userId: string,
    threadUserId: string | null = null,
  ): ToAnswerReply => ({
    channelId,
    postId,
    threadUserId,
    authorId: userId,
    author: 'MEMBER',
  });
  const manager = (
    channelId: string,
    postId: string,
    userId: string,
    threadUserId: string | null = null,
  ): ToAnswerReply => ({
    channelId,
    postId,
    threadUserId,
    authorId: userId,
    author: 'MANAGER',
  });

  it('PRIVATE: counts each conversation whose latest reply is the member’s', () => {
    const ana = (r: (c: string, p: string, u: string, t: string) => ToAnswerReply, u: string) =>
      r('PRIV', 'P1', u, 'ana');
    expect(countToAnswer(channels, [ana(member, 'ana'), member('PRIV', 'P1', 'beto', 'beto')]).get('PRIV')).toBe(2);
    // Answering Ana's conversation leaves Beto's.
    expect(
      countToAnswer(channels, [ana(member, 'ana'), member('PRIV', 'P1', 'beto', 'beto'), ana(manager, 'teacher')]).get(
        'PRIV',
      ),
    ).toBe(1);
    // Ana writes again: waiting again. Several replies in one conversation count once.
    expect(
      countToAnswer(channels, [
        ana(member, 'ana'),
        ana(manager, 'teacher'),
        ana(member, 'ana'),
        ana(member, 'ana'),
      ]).get('PRIV'),
    ).toBe(1);
    // The same member on another post is another conversation.
    expect(
      countToAnswer(channels, [member('PRIV', 'P1', 'ana', 'ana'), member('PRIV', 'P2', 'ana', 'ana')]).get('PRIV'),
    ).toBe(2);
  });

  it('PRIVATE: replies from before the channel turned private belong to their author', () => {
    expect(countToAnswer(channels, [member('PRIV', 'P1', 'ana', null)]).get('PRIV')).toBe(1);
  });

  it('PUBLIC: counts member replies newer than the latest manager reply in the thread', () => {
    expect(countToAnswer(channels, [member('PUB', 'P1', 'ana'), member('PUB', 'P1', 'beto')]).get('PUB')).toBe(2);
    expect(
      countToAnswer(channels, [
        member('PUB', 'P1', 'ana'),
        member('PUB', 'P1', 'beto'),
        manager('PUB', 'P1', 'admin'),
      ]).get('PUB'),
    ).toBeUndefined();
    expect(
      countToAnswer(channels, [
        member('PUB', 'P1', 'ana'),
        manager('PUB', 'P1', 'admin'),
        member('PUB', 'P1', 'carla'),
        member('PUB', 'P2', 'beto'),
      ]).get('PUB'),
    ).toBe(2);
  });

  it('ignores replies of deleted authors and of channels not given', () => {
    expect(
      countToAnswer(channels, [
        { ...member('PUB', 'P1', 'ana'), authorId: null, author: 'UNKNOWN' },
        member('OTHER', 'P9', 'ana'),
      ]).size,
    ).toBe(0);
  });

  it('tells members from managers by role', () => {
    expect(replyAuthor('STUDENT', true)).toBe('MEMBER');
    expect(replyAuthor('parent', true)).toBe('MEMBER');
    expect(replyAuthor('TEACHER', true)).toBe('MANAGER');
    expect(replyAuthor('ORG_ADMIN', true)).toBe('MANAGER');
    expect(replyAuthor(null, false)).toBe('UNKNOWN');
  });
});

describe('GET channels: toAnswer @FR-COM-003.19', () => {
  const row = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    organizationId: 'org-1',
    scope: 'COURSE',
    schoolId: 'S1',
    studyPlanId: null,
    classGroupId: null,
    courseId: 'C1',
    assignmentId: null,
    closesAt: null,
    name: id,
    description: '',
    audienceStudents: true,
    audienceParents: false,
    studentsCanReply: true,
    parentsCanReply: false,
    replyVisibility: 'PRIVATE',
    archivedAt: null,
    createdById: 'u-admin',
    organization: { name: 'Org' },
    school: { name: 'Escuela' },
    studyPlan: null,
    classGroup: null,
    course: { name: 'Matemáticas' },
    assignment: null,
    ...over,
  });

  it('counts for managers, on open channels only', async () => {
    const replyFind = jest.fn(async () => [
      {
        postId: 'P1',
        authorId: 'ana',
        threadUserId: 'ana',
        post: { channelId: 'OPEN' },
        author: { role: { name: 'STUDENT' } },
      },
    ]);
    const prisma = {
      student: { findMany: jest.fn(async () => []) },
      channel: { findMany: jest.fn(async () => [row('OPEN'), row('ARCHIVED', { archivedAt: new Date() })]) },
      channelPost: { findMany: jest.fn(async () => []) },
      channelReply: { findMany: replyFind },
    };
    const service = new ChannelsService(prisma as never);
    const list = await service.list({ userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' } as never);

    expect(Object.fromEntries(list.map((c) => [c.id, c.toAnswer]))).toEqual({ OPEN: 1, ARCHIVED: 0 });
    // Closed channels aren't even queried.
    expect(replyFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ post: { deletedAt: null, channelId: { in: ['OPEN'] } } }),
      }),
    );
  });
});
