import { ForbiddenException } from '@nestjs/common';
import { ThreadStatus, ThreadType } from '@generated/prisma';
import { CommunicationService } from './communication.service';

// Collaborators are passed in as mocks; stub their modules so loading this file doesn't pull in
// the socket/auth/Prisma-adapter stack.
jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
jest.mock('./communication-delivery.service', () => ({ CommunicationDeliveryService: class {} }));
jest.mock('./communication-socket.gateway', () => ({ CommunicationSocketGateway: class {} }));

/**
 * COM-002-S04, S07 / BR-COM-002.7 — teachers may only broadcast to their own courses and to class
 * groups related to those courses (a student of the group is on one of their course rosters).
 */
describe('CommunicationService — teacher broadcast audience (BR-COM-002.7)', () => {
  const ORG = 'org-1';
  const TEACHER_ID = 'teacher-1';
  const RELATED_TEACHER_FILTER = {
    students: { some: { courseEnrollments: { some: { excluded: false, course: { teacherId: TEACHER_ID } } } } },
  };

  function build(role: string, opts: { teacher?: { id: string } | null; allowed?: boolean } = {}) {
    const prisma = {
      teacher: {
        findFirst: jest.fn().mockResolvedValue(opts.teacher === undefined ? { id: TEACHER_ID } : opts.teacher),
        findMany: jest.fn().mockResolvedValue([]),
      },
      classGroup: {
        count: jest.fn().mockResolvedValue(opts.allowed ? 1 : 0),
        findMany: jest.fn().mockResolvedValue([{ id: 'cg-1', name: '7°A' }]),
      },
      course: {
        count: jest.fn().mockResolvedValue(opts.allowed ? 1 : 0),
        findMany: jest.fn().mockResolvedValue([{ id: 'c-1', name: 'Matemáticas', code: 'MAT' }]),
      },
      student: { findMany: jest.fn().mockResolvedValue([]) },
      communicationThread: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'thread-1', ...data })),
      },
      communicationAuditLog: { create: jest.fn().mockResolvedValue({}) },
      communicationMessage: { findMany: jest.fn().mockResolvedValue([]) },
      threadParticipant: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const request = { user: { userId: 'user-1', organizationId: ORG, role } };
    const service = new CommunicationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      request as never,
    );
    return { service, prisma };
  }

  const broadcast = (type: ThreadType, scopeId: string) => ({ type, scopeId, title: 'Aviso', body: 'Mañana no hay clases' });

  describe('createBroadcast', () => {
    it('lets a teacher broadcast to a class group related to one of their courses', async () => {
      const { service, prisma } = build('TEACHER', { allowed: true });

      const thread = await service.createBroadcast(broadcast(ThreadType.CLASS_GROUP, 'cg-1'));

      expect(prisma.classGroup.count).toHaveBeenCalledWith({
        where: { id: 'cg-1', organizationId: ORG, ...RELATED_TEACHER_FILTER },
      });
      expect(thread.status).toBe(ThreadStatus.APPROVED);
    });

    it('refuses an unrelated class group and creates nothing', async () => {
      const { service, prisma } = build('TEACHER', { allowed: false });

      await expect(service.createBroadcast(broadcast(ThreadType.CLASS_GROUP, 'cg-other'))).rejects.toThrow(
        new ForbiddenException('You can only broadcast to your own groups or courses'),
      );
      expect(prisma.student.findMany).not.toHaveBeenCalled();
      expect(prisma.communicationThread.create).not.toHaveBeenCalled();
    });

    it('does not treat homeroom (ClassGroup.teacherId) as a relation', async () => {
      const { service, prisma } = build('TEACHER', { allowed: false });

      await expect(service.createBroadcast(broadcast(ThreadType.CLASS_GROUP, 'cg-homeroom'))).rejects.toThrow(
        ForbiddenException,
      );
      const where = prisma.classGroup.count.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('teacherId');
      expect(where).toMatchObject(RELATED_TEACHER_FILTER);
    });

    it("refuses another teacher's course", async () => {
      const { service, prisma } = build('TEACHER', { allowed: false });

      await expect(service.createBroadcast(broadcast(ThreadType.COURSE, 'c-other'))).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.course.count).toHaveBeenCalledWith({
        where: { id: 'c-other', organizationId: ORG, teacherId: TEACHER_ID },
      });
    });

    it('refuses a TEACHER user that has no teacher record in the organization', async () => {
      const { service, prisma } = build('TEACHER', { teacher: null, allowed: true });

      await expect(service.createBroadcast(broadcast(ThreadType.CLASS_GROUP, 'cg-1'))).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.teacher.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', organizationId: ORG },
        select: { id: true },
      });
    });

    it('does not restrict school-wide broadcasts by teacher (they still need approval)', async () => {
      const { service, prisma } = build('TEACHER');

      const thread = await service.createBroadcast(broadcast(ThreadType.SCHOOL_WIDE, 'school-1'));

      expect(prisma.teacher.findFirst).not.toHaveBeenCalled();
      expect(thread.status).toBe(ThreadStatus.PENDING_APPROVAL);
    });

    it("reaches a course's roster, not a study plan (COM-002-S07)", async () => {
      const { service, prisma } = build('TEACHER', { allowed: true });

      await service.createBroadcast(broadcast(ThreadType.COURSE, 'c-1'));

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG, courseEnrollments: { some: { excluded: false, courseId: 'c-1' } } },
        }),
      );
    });

    it('does not restrict school admins', async () => {
      const { service, prisma } = build('ORG_ADMIN');

      const thread = await service.createBroadcast(broadcast(ThreadType.CLASS_GROUP, 'any-group'));

      expect(prisma.teacher.findFirst).not.toHaveBeenCalled();
      expect(prisma.classGroup.count).not.toHaveBeenCalled();
      expect(thread.status).toBe(ThreadStatus.APPROVED);
    });
  });

  describe('listBroadcastAudiences', () => {
    it("returns only a teacher's courses and related groups, scoped to org and school", async () => {
      const { service, prisma } = build('TEACHER');

      const result = await service.listBroadcastAudiences('school-1');

      expect(prisma.classGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG, schoolId: 'school-1', ...RELATED_TEACHER_FILTER },
        }),
      );
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: ORG, schoolId: 'school-1', teacherId: TEACHER_ID } }),
      );
      expect(result.classGroups).toEqual([{ id: 'cg-1', name: '7°A' }]);
    });

    it('returns nothing for a TEACHER user without a teacher record', async () => {
      const { service, prisma } = build('TEACHER', { teacher: null });

      await expect(service.listBroadcastAudiences('school-1')).resolves.toEqual({ classGroups: [], courses: [] });
      expect(prisma.classGroup.findMany).not.toHaveBeenCalled();
    });

    it('returns every group and course of the school for admins', async () => {
      const { service, prisma } = build('ORG_ADMIN');

      await service.listBroadcastAudiences('school-1');

      expect(prisma.classGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: ORG, schoolId: 'school-1' } }),
      );
    });

    it('refuses non-staff roles', async () => {
      const { service } = build('PARENT');
      await expect(service.listBroadcastAudiences()).rejects.toThrow(ForbiddenException);
    });
  });
});
