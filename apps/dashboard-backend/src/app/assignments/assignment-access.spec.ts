import { BadRequestException, ForbiddenException } from '@nestjs/common';

// The `@/auth` barrel pulls in better-auth's ESM build, which this Jest setup can't parse. The
// controller only needs the guards, decorators and Perm enum, so serve those from source.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({
  ...jest.requireActual('../../../../../libs/auth/src/lib/auth.guard'),
  ...jest.requireActual('../../../../../libs/auth/src/lib/permissions/permissions.constants'),
}));
jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
jest.mock('./assignments.service', () => ({ AssignmentsService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import {
  AssignmentAccessService,
  GROUP_MISMATCH,
  groupFilter,
  MOVE_DENIED,
  READ_DENIED,
  TEACHER_MISMATCH,
  WRITE_DENIED,
} from './assignment-access.service';
import { AssignmentsController } from './assignments.controller';

/**
 * Assignment endpoints check permission, organization and ownership. Runs the real controller and
 * AssignmentAccessService against an in-memory stand-in for the Prisma queries they make.
 */

// ── Fixture ────────────────────────────────────────────────────────────────────────────────────
// Org 1: school SCH1, course C1 taught by teacher-1. Groups G1 and G2 in SCH1. S1 (G1, parent
// u-parent) and S3 (G2) are enrolled in C1. Org 2: school SCH9, course C9, group G9, student S9.
const courses = [
  { id: 'C1', organizationId: 'org-1', schoolId: 'SCH1', teacherId: 'teacher-1' },
  { id: 'C9', organizationId: 'org-2', schoolId: 'SCH9', teacherId: 'teacher-9' },
];
const schools = [
  { id: 'SCH1', organizationId: 'org-1' },
  { id: 'SCH9', organizationId: 'org-2' },
];
const teachers = [
  { id: 'teacher-1', userId: 'u-teacher', organizationId: 'org-1' },
  { id: 'teacher-2', userId: 'u-teacher2', organizationId: 'org-1' },
  { id: 'teacher-9', userId: 'u-teacher9', organizationId: 'org-2' },
];
const classGroups = [
  { id: 'G1', organizationId: 'org-1', schoolId: 'SCH1' },
  { id: 'G2', organizationId: 'org-1', schoolId: 'SCH1' },
  { id: 'G9', organizationId: 'org-2', schoolId: 'SCH9' },
];
const students = [
  { id: 'S1', userId: 'u-s1', organizationId: 'org-1', schoolId: 'SCH1', classGroupId: 'G1', courseIds: ['C1'], parentUserIds: ['u-parent'] },
  { id: 'S3', userId: 'u-s3', organizationId: 'org-1', schoolId: 'SCH1', classGroupId: 'G2', courseIds: ['C1'], parentUserIds: [] },
  { id: 'S9', userId: 'u-s9', organizationId: 'org-2', schoolId: 'SCH9', classGroupId: 'G9', courseIds: ['C9'], parentUserIds: [] },
];
const assignments = [
  { id: 'A1', courseId: 'C1', schoolId: 'SCH1' },
  { id: 'A9', courseId: 'C9', schoolId: 'SCH9' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function studentMatches(s: (typeof students)[number], where: any): boolean {
  if (where.userId && s.userId !== where.userId) return false;
  if (where.organizationId && s.organizationId !== where.organizationId) return false;
  if (where.schoolId && s.schoolId !== where.schoolId) return false;
  if (where.parents?.some?.userId && !s.parentUserIds.includes(where.parents.some.userId)) return false;
  const courseId = where.courseEnrollments?.some?.courseId;
  if (courseId && !s.courseIds.includes(courseId)) return false;
  return true;
}

function fakePrisma() {
  return {
    course: { findUnique: async ({ where }: { where: { id: string } }) => courses.find((c) => c.id === where.id) ?? null },
    school: { findUnique: async ({ where }: { where: { id: string } }) => schools.find((s) => s.id === where.id) ?? null },
    assignment: {
      findUnique: async ({ where }: { where: { id: string } }) => assignments.find((a) => a.id === where.id) ?? null,
    },
    teacher: {
      findFirst: async ({ where }: { where: { userId: string; organizationId: string } }) =>
        teachers.find((t) => t.userId === where.userId && t.organizationId === where.organizationId) ?? null,
      count: async ({ where }: { where: { id: string; organizationId: string } }) =>
        teachers.filter((t) => t.id === where.id && t.organizationId === where.organizationId).length,
    },
    classGroup: {
      count: async ({ where }: { where: { id: { in: string[] }; organizationId: string; schoolId: string } }) =>
        classGroups.filter(
          (g) => where.id.in.includes(g.id) && g.organizationId === where.organizationId && g.schoolId === where.schoolId,
        ).length,
    },
    student: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findMany: async ({ where }: { where: any }) =>
        students.filter((s) => studentMatches(s, where)).map((s) => ({ classGroupId: s.classGroupId })),
    },
  };
}

const user = (userId: string, role: string, organizationId: string | null = 'org-1') =>
  ({ userId, role, organizationId, permissions: [] }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const otherAdmin = user('u-admin9', 'ORG_ADMIN', 'org-2');
const teacher = user('u-teacher', 'TEACHER');
const colleague = user('u-teacher2', 'TEACHER');
const s1 = user('u-s1', 'STUDENT');
const parent = user('u-parent', 'PARENT', null);
const req = (u: unknown) => ({ user: u }) as never;
const range = ['2026-01-01', '2026-12-31'] as const;

describe('Assignment access', () => {
  let access: AssignmentAccessService;
  let service: Record<string, jest.Mock>;
  let controller: AssignmentsController;

  beforeEach(() => {
    access = new AssignmentAccessService(fakePrisma() as never);
    service = {
      create: jest.fn(async () => ({})),
      findAll: jest.fn(async () => []),
      findAssignmentBySchoolId: jest.fn(async () => []),
      findAssignmentByCourseId: jest.fn(async () => []),
      findAssignmentDatesBySchoolId: jest.fn(async () => []),
      findAssignmentDatesByCourseId: jest.fn(async () => []),
      findOne: jest.fn(async () => ({})),
      update: jest.fn(async () => ({})),
      remove: jest.fn(async () => ({})),
    };
    controller = new AssignmentsController(service as never, access);
  });

  it('needs VIEW_ASSIGNMENTS to read and MANAGE_ASSIGNMENTS to write', () => {
    const perms = (handler?: object) =>
      Reflect.getMetadata(PERMISSIONS_KEY, handler ?? AssignmentsController) as Perm[] | undefined;
    expect(perms()).toEqual([Perm.VIEW_ASSIGNMENTS]);
    for (const write of [controller.create, controller.update, controller.remove, controller.findAll]) {
      expect(perms(write)).toEqual([Perm.MANAGE_ASSIGNMENTS]);
    }
  });

  describe('writes', () => {
    const input = { courseId: 'C1', schoolId: 'SCH9', teacherId: 'teacher-1', groupDates: [{ classGroupId: 'G1' }] };

    it("lets the course's teacher and its organization's admins create, taking the school from the course", async () => {
      await controller.create(req(teacher), input as never);
      await controller.create(req(admin), input as never);
      expect(service.create).toHaveBeenCalledTimes(2);
      expect(service.create).toHaveBeenCalledWith(input, 'SCH1');
    });

    it('refuses another teacher, another organization\'s admin, students and parents', async () => {
      for (const u of [colleague, otherAdmin, s1, parent]) {
        await expect(controller.create(req(u), input as never)).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
        await expect(controller.update(req(u), { id: 'A1', title: 'x' } as never)).rejects.toThrow(
          new ForbiddenException(WRITE_DENIED),
        );
        await expect(controller.remove(req(u), 'A1')).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
      }
      expect(service.create).not.toHaveBeenCalled();
      expect(service.update).not.toHaveBeenCalled();
      expect(service.remove).not.toHaveBeenCalled();
    });

    it("refuses another organization's group or teacher", async () => {
      await expect(
        controller.create(req(teacher), { ...input, groupDates: [{ classGroupId: 'G9' }] } as never),
      ).rejects.toThrow(new BadRequestException(GROUP_MISMATCH));
      await expect(controller.create(req(teacher), { ...input, teacherId: 'teacher-9' } as never)).rejects.toThrow(
        new BadRequestException(TEACHER_MISMATCH),
      );
    });

    it('refuses moving an assignment to another course or school', async () => {
      await expect(controller.update(req(admin), { id: 'A1', courseId: 'C9' } as never)).rejects.toThrow(
        new BadRequestException(MOVE_DENIED),
      );
      await expect(controller.update(req(admin), { id: 'A1', schoolId: 'SCH9' } as never)).rejects.toThrow(
        new BadRequestException(MOVE_DENIED),
      );
      await controller.update(req(teacher), { id: 'A1', courseId: 'C1', title: 'Nuevo' } as never);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it("lists only the caller's organization", async () => {
      await controller.findAll(req(admin));
      expect(service.findAll).toHaveBeenCalledWith('org-1');
    });
  });

  describe('reads', () => {
    it("shows staff of the organization every group's dates, or the one they pick", async () => {
      for (const u of [admin, teacher, colleague]) {
        await controller.findAssignmentDatesBySchoolId(req(u), 'SCH1', ...range);
        await controller.findAssignmentDatesByCourseId(req(u), 'C1', ...range, 'G2');
      }
      expect(service.findAssignmentDatesBySchoolId).toHaveBeenCalledWith('SCH1', expect.any(Date), expect.any(Date), undefined);
      expect(service.findAssignmentDatesByCourseId).toHaveBeenCalledWith('C1', expect.any(Date), expect.any(Date), ['G2']);
    });

    it('limits a student and a parent to their own groups', async () => {
      await controller.findAssignmentDatesBySchoolId(req(s1), 'SCH1', ...range);
      await controller.findAssignmentDatesByCourseId(req(parent), 'C1', ...range);
      await controller.findOne(req(s1), 'A1');
      expect(service.findAssignmentDatesBySchoolId).toHaveBeenCalledWith('SCH1', expect.any(Date), expect.any(Date), ['G1']);
      expect(service.findAssignmentDatesByCourseId).toHaveBeenCalledWith('C1', expect.any(Date), expect.any(Date), ['G1']);
      expect(service.findOne).toHaveBeenCalledWith('A1', ['G1']);
    });

    it("refuses a student asking for another group's dates", async () => {
      await expect(controller.findAssignmentDatesByCourseId(req(s1), 'C1', ...range, 'G2')).rejects.toThrow(
        new ForbiddenException(READ_DENIED),
      );
    });

    it('refuses other organizations and callers with no student in the course', async () => {
      await expect(controller.findOne(req(teacher), 'A9')).rejects.toThrow(new ForbiddenException(READ_DENIED));
      await expect(controller.findAssignmentDatesBySchoolId(req(admin), 'SCH9', ...range)).rejects.toThrow(
        new ForbiddenException(READ_DENIED),
      );
      await expect(controller.findAssignmentByCourseId(req(s1), 'C9', ...range)).rejects.toThrow(
        new ForbiddenException(READ_DENIED),
      );
      await expect(controller.findOne(req(user('u-nobody', 'PARENT', null)), 'A1')).rejects.toThrow(
        new ForbiddenException(READ_DENIED),
      );
    });
  });

  it('groupFilter keeps the requested group within the scope', () => {
    expect(groupFilter(null)).toBeUndefined();
    expect(groupFilter(null, 'G2')).toEqual(['G2']);
    expect(groupFilter(['G1'])).toEqual(['G1']);
    expect(() => groupFilter(['G1'], 'G2')).toThrow(ForbiddenException);
  });
});
