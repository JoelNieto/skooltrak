jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({ sendEmail: jest.fn() }));

import {
  ConfirmationRemindersService,
  dueRecipients,
  REMIND_AFTER_MS,
  reminderEmail,
} from './confirmation-reminders.service';

/**
 * COM-003-S05: one email reminder per member per post that asks for confirmation, 24 hours after it
 * was published (FR .21, BR .15). The audience of channel CH1 is u-ana and u-paula (their student and
 * parent records); u-teacher wrote the post.
 */
const now = new Date('2026-11-26T12:00:00Z');
const channel = {
  id: 'CH1',
  organizationId: 'org-1',
  scope: 'CLASS_GROUP',
  schoolId: 'S1',
  studyPlanId: null,
  classGroupId: 'G1',
  courseId: null,
  assignmentId: null,
  name: 'Avisos <7°A>',
  audienceStudents: true,
  audienceParents: true,
  archivedAt: null,
  closesAt: null,
};
const person = (id: string, email: string) => ({
  id,
  email,
  name: null,
  firstName: id.replace('u-', ''),
  lastName: '',
});

function setup(opts: { confirmed?: string[]; reminded?: string[]; sendFails?: string[] } = {}) {
  const reminders: unknown[] = [];
  const sent: { to: string; subject: string; html: string }[] = [];
  const prisma = {
    channelPost: {
      findMany: jest.fn(async () => [
        { id: 'P1', authorId: 'u-teacher', createdAt: new Date(now.getTime() - REMIND_AFTER_MS - 1), channel },
      ]),
    },
    student: {
      findMany: jest.fn(async () => [{ userId: 'u-ana', user: { name: null, firstName: 'Ana', lastName: 'E2E' } }]),
    },
    parent: {
      findMany: jest.fn(async () => [
        {
          userId: 'u-paula',
          user: { name: null, firstName: 'Paula', lastName: 'A' },
          students: [{ firstName: 'Ana', fatherName: 'E2E' }],
        },
      ]),
    },
    channelPostRead: { findMany: jest.fn(async () => (opts.confirmed ?? []).map((userId) => ({ userId }))) },
    channelPostReminder: {
      findMany: jest.fn(async () => (opts.reminded ?? []).map((userId) => ({ userId }))),
      create: jest.fn(async ({ data }) => reminders.push(data)),
    },
    user: {
      findMany: jest.fn(async ({ where }) =>
        [person('u-ana', 'ana@e2e.test'), person('u-paula', 'paula@e2e.test')].filter((u) =>
          where.id.in.includes(u.id),
        ),
      ),
    },
  };
  const send = jest.fn(async (email: { to: string; subject: string; html: string }) => {
    if ((opts.sendFails ?? []).includes(email.to)) return { error: { message: 'rate limited' } };
    sent.push(email);
    return { data: { id: 'email-1' }, error: null };
  });
  return { service: new ConfirmationRemindersService(prisma as never, send), prisma, send, sent, reminders };
}

describe('Confirmation reminders (COM-003-S05)', () => {
  it('emails each member who hasn’t confirmed, once, and records it @FR-COM-003.21 @BR-COM-003.15', async () => {
    const { service, sent, reminders } = setup();
    await expect(service.remindDue(now)).resolves.toEqual({ sent: 2, failed: 0 });
    expect(sent.map((e) => e.to).sort()).toEqual(['ana@e2e.test', 'paula@e2e.test']);
    expect(reminders).toEqual([
      { postId: 'P1', userId: 'u-ana' },
      { postId: 'P1', userId: 'u-paula' },
    ]);
  });

  it('skips who confirmed and who was already reminded @BR-COM-003.15', async () => {
    const { service, sent } = setup({ confirmed: ['u-ana'], reminded: ['u-paula'] });
    await expect(service.remindDue(now)).resolves.toEqual({ sent: 0, failed: 0 });
    expect(sent).toEqual([]);
  });

  it('records nothing for a failed send, so it is retried next hour @BR-COM-003.15', async () => {
    const { service, reminders } = setup({ sendFails: ['paula@e2e.test'] });
    await expect(service.remindDue(now)).resolves.toEqual({ sent: 1, failed: 1 });
    expect(reminders).toEqual([{ postId: 'P1', userId: 'u-ana' }]);
  });

  it('only looks at posts asking for confirmation 24 h ago, in open channels @BR-COM-003.15 @BR-COM-003.11', async () => {
    const { service, prisma } = setup();
    await service.remindDue(now);
    const where = (prisma.channelPost.findMany.mock.calls[0] as unknown as [{ where: Record<string, unknown> }])[0]
      .where;
    expect(where).toMatchObject({
      requiresConfirmation: true,
      deletedAt: null,
      createdAt: { lte: new Date(now.getTime() - REMIND_AFTER_MS) },
      channel: { archivedAt: null, OR: [{ closesAt: null }, { closesAt: { gt: now } }] },
    });
  });

  it('never reminds the author, nor anyone twice', () => {
    expect(dueRecipients(['a', 'b', 'b', 'author'], ['a'], [], 'author')).toEqual(['b']);
  });

  it('names the channel and the date, links to it, escapes them, and never copies the post (§8)', () => {
    const { subject, html } = reminderEmail({
      name: 'Paula <A>',
      channel: 'Avisos <7°A>',
      publishedAt: new Date('2026-11-25T12:00:00Z'),
      url: 'https://app.example/communication/channels/CH1',
      timeZone: 'UTC',
    });
    expect(subject).toBe('Confirma la lectura en «Avisos <7°A>»');
    expect(html).toContain('Hola Paula &lt;A&gt;,');
    expect(html).toContain('«Avisos &lt;7°A&gt;»');
    expect(html).toContain('25 de noviembre de 2026');
    expect(html).toContain('href="https://app.example/communication/channels/CH1"');
    expect(html).not.toContain('<A>');
  });
});
