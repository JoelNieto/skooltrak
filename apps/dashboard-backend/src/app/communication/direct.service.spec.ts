import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { NO_STUDENTS_DIRECT, STAFF_ONLY } from './communication-access';
import { CONVERSATION_NOT_FOUND, DirectService, PARENT_NOT_LINKED, PARENT_NOT_REACHABLE } from './direct.service';

/**
 * COM-003 direct messages. Teacher T1 (u-teacher) reaches student st-1, whose parent is u-parent.
 * Student st-9 is outside the teacher's courses and groups.
 */
const user = (userId: string, role: string, organizationId = 'org-1') => ({ userId, role, organizationId }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const teacher = user('u-teacher', 'TEACHER');
const parent = user('u-parent', 'PARENT');
const student = user('u-student', 'STUDENT');

const person = (id: string) => ({ id, name: id, firstName: id, lastName: '' });
const conversation = {
  id: 'D1',
  organizationId: 'org-1',
  staffUserId: 'u-teacher',
  parentUserId: 'u-parent',
  studentId: 'st-1',
  staffLastReadAt: null,
  parentLastReadAt: null,
  lastMessageAt: new Date('2026-11-20T10:00:00Z'),
  staffUser: person('u-teacher'),
  parentUser: person('u-parent'),
  student: { id: 'st-1', firstName: 'Ana', fatherName: 'Pérez' },
  messages: [],
};

/** Whether a student `where` reaches the student id: admins reach all; teachers only st-1. */
const reaches = (where: { AND?: Array<Record<string, unknown>> }, id: string) => {
  const reach = where.AND?.[1] as { OR?: unknown } | undefined;
  return !reach?.OR || id === 'st-1';
};

function setup(opts: { existing?: boolean } = {}) {
  const created: unknown[] = [];
  const prisma = {
    teacher: { findFirst: jest.fn(async ({ where }) => (where.userId === 'u-teacher' ? { id: 'T1' } : null)) },
    student: {
      findFirst: jest.fn(async ({ where }) => (['st-1', 'st-9'].includes(where.id) ? { id: where.id, parents: [{ id: 'p1' }] } : null)),
      count: jest.fn(async ({ where }) => (reaches(where, where.AND[0].id) ? 1 : 0)),
    },
    parent: { count: jest.fn(async () => 1) },
    directConversation: {
      findFirst: jest.fn(async ({ where }) => {
        if (where.OR) {
          const [asStaff, asParent] = where.OR as Array<Record<string, string>>;
          const staffIds = [conversation.staffUserId, ...created.map((c) => (c as { staffUserId: string }).staffUserId)];
          if (where.id !== 'D1') return null;
          if (asParent['parentUserId'] === conversation.parentUserId) return conversation;
          return staffIds.includes(asStaff['staffUserId'])
            ? { ...conversation, staffUserId: asStaff['staffUserId'], staffUser: person(asStaff['staffUserId']) }
            : null;
        }
        return opts.existing ? { id: 'D1' } : null;
      }),
      create: jest.fn(async ({ data }) => {
        created.push(data);
        return { id: 'D1' };
      }),
      update: jest.fn(async () => conversation),
      findMany: jest.fn(async () => []),
    },
    directMessage: { findMany: jest.fn(async () => []), count: jest.fn(async () => 0), create: jest.fn() },
    // COM-003-S04: get() tells whether the conversation has an open report.
    directConversationReport: { count: jest.fn(async () => 0) },
    $transaction: jest.fn(async (ops: unknown[]) => [{ id: 'M1', createdAt: new Date() }, ops[1]]),
  };
  return { service: new DirectService(prisma as never), prisma, created };
}

describe('DirectService (COM-003)', () => {
  it('is never available to students @BR-COM-003.7', async () => {
    const { service } = setup();
    await expect(service.list(student)).rejects.toThrow(new ForbiddenException(NO_STUDENTS_DIRECT));
    await expect(service.get(student, 'D1')).rejects.toThrow(new ForbiddenException(NO_STUDENTS_DIRECT));
    await expect(service.unreadCount(student)).resolves.toBe(0);
  });

  it('only lets staff start a conversation @BR-COM-003.1', async () => {
    const { service } = setup();
    await expect(service.start(parent, { parentUserId: 'u-parent' })).rejects.toThrow(new ForbiddenException(STAFF_ONLY));
    await expect(service.start(student, { parentUserId: 'u-parent' })).rejects.toThrow(new ForbiddenException(STAFF_ONLY));
  });

  it("limits teachers to their students' parents; admins reach the organization @BR-COM-003.8", async () => {
    const { service, created } = setup();
    await expect(service.start(teacher, { parentUserId: 'u-parent', studentId: 'st-9' })).rejects.toThrow(
      new ForbiddenException(PARENT_NOT_REACHABLE),
    );
    await service.start(teacher, { parentUserId: 'u-parent', studentId: 'st-1' });
    await service.start(admin, { parentUserId: 'u-parent', studentId: 'st-9' });
    expect(created).toEqual([
      { organizationId: 'org-1', staffUserId: 'u-teacher', parentUserId: 'u-parent', studentId: 'st-1' },
      { organizationId: 'org-1', staffUserId: 'u-admin', parentUserId: 'u-parent', studentId: 'st-9' },
    ]);
  });

  it('requires the parent to be linked to the child @BR-COM-003.8', async () => {
    const { service, prisma } = setup();
    prisma.student.findFirst.mockResolvedValueOnce({ id: 'st-1', parents: [] } as never);
    await expect(service.start(teacher, { parentUserId: 'u-other', studentId: 'st-1' })).rejects.toThrow(
      new BadRequestException(PARENT_NOT_LINKED),
    );
  });

  it('reopens the existing conversation instead of creating another @FR-COM-003.12', async () => {
    const { service, created } = setup({ existing: true });
    const detail = await service.start(teacher, { parentUserId: 'u-parent', studentId: 'st-1' });
    expect(created).toEqual([]);
    expect(detail.id).toBe('D1');
    expect(detail.side).toBe('STAFF');
  });

  it('shows a conversation only to its two participants @BR-COM-003.9', async () => {
    const { service } = setup();
    await expect(service.get(parent, 'D1')).resolves.toEqual(expect.objectContaining({ side: 'PARENT' }));
    await expect(service.get(user('u-other-parent', 'PARENT'), 'D1')).rejects.toThrow(
      new NotFoundException(CONVERSATION_NOT_FOUND),
    );
    await expect(service.send(admin, 'D1', { body: 'Hola' })).rejects.toThrow(new NotFoundException(CONVERSATION_NOT_FOUND));
  });

  it('lets the parent reply @FR-COM-003.13', async () => {
    const { service, prisma } = setup();
    await service.send(parent, 'D1', { body: ' Gracias ' });
    expect(prisma.directMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ conversationId: 'D1', senderId: 'u-parent', body: 'Gracias' }),
    });
    expect(prisma.directConversation.update).toHaveBeenCalledWith({
      where: { id: 'D1' },
      data: expect.objectContaining({ parentLastReadAt: expect.any(Date), lastMessageAt: expect.any(Date) }),
    });
  });
});
