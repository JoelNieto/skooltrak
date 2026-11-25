import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import {
  ADMINS_ONLY,
  ALREADY_RESOLVED,
  CONVERSATION_NOT_FOUND,
  DirectService,
  REPORT_NOT_FOUND,
} from './direct.service';

/**
 * COM-003-S04: reported direct conversations (FR .20, BR .14). Conversation D1 in org-1 is between
 * u-teacher and u-parent; u-admin is an admin of org-1, u-admin2 of org-2.
 */
const user = (userId: string, role: string, organizationId = 'org-1') => ({ userId, role, organizationId }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const otherOrgAdmin = user('u-admin2', 'ORG_ADMIN', 'org-2');
const teacher = user('u-teacher', 'TEACHER');
const parent = user('u-parent', 'PARENT');
const stranger = user('u-other', 'PARENT');

const person = (id: string) => ({ id, name: id, firstName: id, lastName: '' });
const parties = {
  staffUser: person('u-teacher'),
  parentUser: person('u-parent'),
  student: { id: 'st-1', firstName: 'Ana', fatherName: 'Pérez' },
};
const conversation = {
  id: 'D1',
  organizationId: 'org-1',
  staffUserId: 'u-teacher',
  parentUserId: 'u-parent',
  staffLastReadAt: null,
  parentLastReadAt: null,
  lastMessageAt: new Date('2026-11-25T09:00:00Z'),
  ...parties,
  messages: [],
};
const reportRow = (over: Record<string, unknown> = {}) => ({
  id: 'R1',
  conversationId: 'D1',
  reportedById: 'u-parent',
  reason: 'Tono inapropiado',
  createdAt: new Date('2026-11-25T10:00:00Z'),
  resolvedAt: null,
  resolvedById: null,
  resolution: null,
  reportedBy: person('u-parent'),
  resolvedBy: null,
  conversation: { id: 'D1', ...parties },
  ...over,
});

function setup(opts: { openReport?: boolean; report?: Record<string, unknown> | null } = {}) {
  const accesses: unknown[] = [];
  const reports: unknown[] = [];
  const prisma = {
    directConversation: {
      findFirst: jest.fn(async ({ where }) => {
        if (where.id !== 'D1') return null;
        // Participants (BR .9).
        if (where.OR) {
          const ids = (where.OR as Array<Record<string, string>>).flatMap((o) => Object.values(o));
          return ids.includes('u-teacher') || ids.includes('u-parent') ? conversation : null;
        }
        // Admin review: same organization and an open report (BR .14).
        if (where.organizationId !== 'org-1') return null;
        if (where.reports && !opts.openReport) return null;
        return { ...conversation };
      }),
    },
    directConversationReport: {
      create: jest.fn(async ({ data }) => {
        reports.push(data);
        return reportRow({
          reportedById: data.reportedById,
          reason: data.reason,
          reportedBy: person(data.reportedById),
        });
      }),
      findMany: jest.fn(async () => [reportRow()]),
      findFirst: jest.fn(async ({ where }) =>
        where.conversation?.organizationId === 'org-1' && where.id === 'R1'
          ? opts.report === undefined
            ? { id: 'R1', resolvedAt: null }
            : opts.report
          : null,
      ),
      update: jest.fn(async ({ data }) => reportRow({ ...data, resolvedBy: person(data.resolvedById) })),
      count: jest.fn(async () => (opts.openReport ? 1 : 0)),
    },
    directConversationAccess: {
      create: jest.fn(async ({ data }) => accesses.push(data)),
      findMany: jest.fn(async () => [{ adminUser: person('u-admin'), accessedAt: new Date('2026-11-25T11:00:00Z') }]),
    },
    directMessage: {
      findMany: jest.fn(async () => [
        { id: 'M1', body: 'Hola', senderId: 'u-teacher', sender: person('u-teacher'), createdAt: new Date() },
      ]),
    },
  };
  return { service: new DirectService(prisma as never), prisma, accesses, reports };
}

describe('Reported direct conversations (COM-003-S04)', () => {
  it('lets either participant report it, and no one else @FR-COM-003.20 @BR-COM-003.14', async () => {
    const { service, reports } = setup();
    await service.report(parent, 'D1', { reason: ' Tono inapropiado ' });
    await service.report(teacher, 'D1', { reason: 'Revisar, por favor' });
    expect(reports).toEqual([
      { conversationId: 'D1', reportedById: 'u-parent', reason: 'Tono inapropiado' },
      { conversationId: 'D1', reportedById: 'u-teacher', reason: 'Revisar, por favor' },
    ]);
    // BR .9: its existence isn't revealed to anyone else.
    await expect(service.report(stranger, 'D1', { reason: 'x' })).rejects.toThrow(
      new NotFoundException(CONVERSATION_NOT_FOUND),
    );
    await expect(service.report(parent, 'D1', { reason: '   ' })).rejects.toThrow(BadRequestException);
  });

  it('lets only admins list and review reports @BR-COM-003.14', async () => {
    const { service } = setup({ openReport: true });
    await expect(service.reports(teacher)).rejects.toThrow(new ForbiddenException(ADMINS_ONLY));
    await expect(service.review(parent, 'D1')).rejects.toThrow(new ForbiddenException(ADMINS_ONLY));
    await expect(service.reports(admin)).resolves.toEqual([
      expect.objectContaining({ id: 'R1', reason: 'Tono inapropiado' }),
    ]);
  });

  it('opens a reported conversation read-only and logs every opening @FR-COM-003.20 @BR-COM-003.14', async () => {
    const { service, accesses, prisma } = setup({ openReport: true });
    const review = await service.review(admin, 'D1');
    expect(review).toMatchObject({
      conversationId: 'D1',
      staff: { id: 'u-teacher' },
      parent: { id: 'u-parent' },
      student: { name: 'Ana Pérez' },
      messages: [{ id: 'M1', body: 'Hola' }],
      reports: [expect.objectContaining({ id: 'R1' })],
    });
    await service.review(admin, 'D1');
    expect(accesses).toEqual([
      { conversationId: 'D1', adminUserId: 'u-admin' },
      { conversationId: 'D1', adminUserId: 'u-admin' },
    ]);
    // Nothing is marked read for the participants.
    expect((prisma.directConversation as Record<string, unknown>)['update']).toBeUndefined();
  });

  it("never opens an unreported conversation, nor another organization's @BR-COM-003.9 @BR-COM-003.14", async () => {
    await expect(setup({ openReport: false }).service.review(admin, 'D1')).rejects.toThrow(
      new NotFoundException(CONVERSATION_NOT_FOUND),
    );
    const { service, accesses } = setup({ openReport: true });
    await expect(service.review(otherOrgAdmin, 'D1')).rejects.toThrow(new NotFoundException(CONVERSATION_NOT_FOUND));
    expect(accesses).toEqual([]);
  });

  it('resolves a report once, with a note @FR-COM-003.20', async () => {
    const { service, prisma } = setup();
    const resolved = await service.resolve(admin, 'R1', { resolution: ' Hablé con el docente. ' });
    expect(resolved).toMatchObject({ resolvedBy: { id: 'u-admin' }, resolution: 'Hablé con el docente.' });
    expect(prisma.directConversationReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolvedById: 'u-admin', resolution: 'Hablé con el docente.' }),
      }),
    );
    await expect(
      setup({ report: { id: 'R1', resolvedAt: new Date() } }).service.resolve(admin, 'R1', { resolution: 'x' }),
    ).rejects.toThrow(new BadRequestException(ALREADY_RESOLVED));
    await expect(setup().service.resolve(otherOrgAdmin, 'R1', { resolution: 'x' })).rejects.toThrow(
      new NotFoundException(REPORT_NOT_FOUND),
    );
  });

  it('tells participants their conversation is reported @FR-COM-003.20', async () => {
    const reported = setup({ openReport: true });
    (reported.prisma.directConversation as Record<string, unknown>)['update'] = jest.fn();
    expect((await reported.service.get(parent, 'D1')).reported).toBe(true);
    const clean = setup({ openReport: false });
    (clean.prisma.directConversation as Record<string, unknown>)['update'] = jest.fn();
    expect((await clean.service.get(parent, 'D1')).reported).toBe(false);
  });
});
