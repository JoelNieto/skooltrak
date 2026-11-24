import { Prisma } from '@generated/prisma';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { AssignmentChannelsService, assignmentCloseTime, assignmentQuestionsPost } from './assignment-channels.service';

/** COM-003-S02: assignment Q&A channels (FR .17, .18; BR .10, .11). */
describe('AssignmentChannelsService', () => {
  const day = 86_400_000;
  const assignment = {
    id: 'A1',
    title: 'Fracciones',
    schoolId: 'S1',
    courseId: 'C1',
    course: { organizationId: 'org-1' },
    teacher: { userId: 'u-teacher' },
    dates: [{ date: new Date('2026-12-01T12:00:00Z') }, { date: new Date('2026-12-04T12:00:00Z') }],
  };

  function setup(opts: { existing?: { id: string } | null; createFails?: unknown } = {}) {
    const channels: unknown[] = [];
    const posts: unknown[] = [];
    const tx = {
      channel: {
        create: jest.fn(async ({ data }) => {
          if (opts.createFails) throw opts.createFails;
          channels.push(data);
          return { id: 'CH-A1' };
        }),
      },
      channelPost: { create: jest.fn(async ({ data }) => posts.push(data)) },
    };
    const prisma = {
      channel: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(opts.existing ?? null)
          .mockResolvedValue({ id: 'CH-RACE' }),
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
      assignment: { findUnique: jest.fn(async () => assignment) },
      assignmentDate: { findMany: jest.fn(async () => [{ date: new Date('2026-12-10T00:00:00Z') }]) },
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    return { service: new AssignmentChannelsService(prisma as never), prisma, channels, posts };
  }

  it('closes 3 days after the latest date, or never without dates @BR-COM-003.11', () => {
    expect(assignmentCloseTime(assignment.dates.map((d) => d.date))?.toISOString()).toBe('2026-12-07T12:00:00.000Z');
    expect(assignmentCloseTime([])).toBeNull();
    expect(assignmentCloseTime([new Date(0)])?.getTime()).toBe(3 * day);
  });

  it('creates a students-only, public-reply channel with a pinned opening post @FR-COM-003.17 @BR-COM-003.10', async () => {
    const { service, channels, posts } = setup();
    await expect(service.ensureFor('A1')).resolves.toEqual({ id: 'CH-A1' });
    expect(channels).toEqual([
      expect.objectContaining({
        organizationId: 'org-1',
        scope: 'ASSIGNMENT',
        schoolId: 'S1',
        courseId: 'C1',
        assignmentId: 'A1',
        name: 'Fracciones',
        audienceStudents: true,
        audienceParents: false,
        studentsCanReply: true,
        parentsCanReply: false,
        replyVisibility: 'PUBLIC',
        createdById: 'u-teacher',
        closesAt: new Date('2026-12-07T12:00:00Z'),
      }),
    ]);
    expect(posts).toEqual([
      { channelId: 'CH-A1', authorId: 'u-teacher', body: assignmentQuestionsPost('Fracciones'), pinned: true },
    ]);
    expect(assignmentQuestionsPost('Fracciones')).toBe(
      'Preguntas sobre «Fracciones». Pregunten aquí; todos ven las respuestas.',
    );
  });

  it('is idempotent: an assignment keeps its one channel @BR-COM-003.10', async () => {
    const { service, prisma, channels } = setup({ existing: { id: 'CH-OLD' } });
    await expect(service.ensureFor('A1')).resolves.toEqual({ id: 'CH-OLD' });
    expect(channels).toEqual([]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns the channel a concurrent call created (unique assignmentId)', async () => {
    const race = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const { service } = setup({ createFails: race });
    await expect(service.ensureFor('A1')).resolves.toEqual({ id: 'CH-RACE' });
  });

  it('moves the close time with the dates @FR-COM-003.18', async () => {
    const { service, prisma } = setup();
    await service.syncCloseTime('A1');
    expect(prisma.channel.updateMany).toHaveBeenCalledWith({
      where: { assignmentId: 'A1' },
      data: { closesAt: new Date('2026-12-13T00:00:00Z') },
    });
  });
});
