import { ForbiddenException } from '@nestjs/common';

// Serve the auth guards/decorators from source (the `@/auth` barrel loads better-auth's ESM build)
// and stub every heavy collaborator of the students module.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({
  ...jest.requireActual('../../../../../libs/auth/src/lib/auth.guard'),
  ...jest.requireActual('../../../../../libs/auth/src/lib/permissions/permissions.constants'),
  AuthService: class {},
  OnboardingStep: {},
  sendUserInvitation: jest.fn(),
}));
jest.mock('@/api-contracts', () => ({ FetchDataQueryDto: class {}, PaginatedResponseDto: class {} }));
jest.mock('@/shared', () => ({ TransformDateToNoon: () => () => undefined }));
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }));
jest.mock('@generated/prisma', () => ({
  PrismaClient: class {
    options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
  },
  Prisma: {},
}));
jest.mock('bcrypt', () => ({}));
jest.mock('qrcode', () => ({}));
jest.mock('../chats/chat-sync.service', () => ({ ChatSyncService: class {} }));
jest.mock('../financial/charges.service', () => ({ ChargesService: class {} }));
jest.mock('../grades/grades.service', () => ({ GradesService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import { GradeAccessService, READ_DENIED } from '../grades/grade-access.service';
import { OMITTED_BY_DEFAULT, PrismaService } from '../prisma.service';
import { StudentsController } from './students.controller';
import { REFS_DENIED, STUDENT_DENIED, StudentsService } from './students.service';

/**
 * Follow-up to ASM-001-S01: the students API's grade routes are scoped like the grade endpoints,
 * and parent-linking enrollment codes reach only admins of the student's organization.
 */

// Org 1: Ana (u-ana, group G1 with homeroom u-homeroom, parent u-parent) takes C1 (u-teacher) and C2
// (u-teacher2). Org 2: Zoe.
const students = {
  ana: {
    organizationId: 'org-1',
    userId: 'u-ana',
    parents: [{ userId: 'u-parent' }],
    classGroup: { teacher: { userId: 'u-homeroom' } },
  },
  zoe: { organizationId: 'org-2', userId: 'u-zoe', parents: [], classGroup: null },
} as const;
const teacherCourses: Record<string, string[]> = { 'u-teacher': ['C1'], 'u-teacher2': ['C2'], 'u-homeroom': [] };

function fakePrisma() {
  return {
    student: {
      findUnique: async ({ where }: { where: { id: keyof typeof students } }) => students[where.id] ?? null,
    },
    teacher: {
      findFirst: async ({ where }: { where: { userId: string } }) =>
        where.userId in teacherCourses ? { courses: teacherCourses[where.userId].map((id) => ({ id })) } : null,
    },
  };
}

const caller = (userId: string, role: string, organizationId: string | null = 'org-1', permissions: string[] = []) => ({
  user: { userId, role, organizationId, permissions },
});

const anaCourses = [
  { id: 'C1', name: 'Matemáticas', grades: [] },
  { id: 'C2', name: 'Ciencias', grades: [] },
];

function buildController() {
  const studentsService = {
    getStudentsGrades: jest.fn().mockResolvedValue(anaCourses),
    findOne: jest.fn().mockResolvedValue({
      id: 'ana',
      organizationId: 'org-1',
      firstName: 'Ana',
      fatherName: 'Pérez',
      middleName: '',
      motherName: '',
      user: null,
    }),
    getEnrollmentCode: jest.fn().mockResolvedValue({ id: 'ana', enrollmentCode: 'ABCD1234', enrollmentCodeGeneratedAt: 'then' }),
    assertCanRead: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    getCount: jest.fn().mockResolvedValue(0),
    findManyBySchoolId: jest.fn().mockResolvedValue([]),
    findManyByClassGroupId: jest.fn().mockResolvedValue([]),
    findManyByCourseId: jest.fn().mockResolvedValue([
      { id: 'ana', firstName: 'Ana', fatherName: 'Pérez', middleName: '', motherName: '', user: null },
      { id: 'bob', firstName: 'Bob', fatherName: 'Ruiz', middleName: '', motherName: '', user: null },
    ]),
  };
  const access = new GradeAccessService(fakePrisma() as never);
  const controller = new StudentsController(studentsService as never, {} as never, access);
  return { controller, studentsService };
}

describe("students API — a student's grades across courses", () => {
  it.each([
    ['the student', caller('u-ana', 'STUDENT')],
    ['a linked parent (any session organization)', caller('u-parent', 'PARENT', 'org-elsewhere')],
    ['the homeroom teacher', caller('u-homeroom', 'TEACHER')],
    ['an admin of the organization', caller('u-admin', 'ORG_ADMIN')],
  ])('%s sees every course', async (_who, req) => {
    const { controller } = buildController();
    const courses = await controller.getStudentsGrades(req as never, 'ana');
    expect(courses.map((c) => c.id)).toEqual(['C1', 'C2']);
  });

  it('a course teacher sees only the courses they teach', async () => {
    const { controller } = buildController();
    const courses = await controller.getStudentsGrades(caller('u-teacher', 'TEACHER') as never, 'ana');
    expect(courses.map((c) => c.id)).toEqual(['C1']);
  });

  it.each([
    ['a classmate', caller('u-bob', 'STUDENT')],
    ['an unlinked parent', caller('u-other-parent', 'PARENT')],
    ['an admin of another organization', caller('u-admin', 'ORG_ADMIN', 'org-2')],
    ['a teacher with no course of the student', caller('u-nobody', 'TEACHER')],
  ])('%s is refused', async (_who, req) => {
    const { controller, studentsService } = buildController();
    await expect(controller.getStudentsGrades(req as never, 'ana')).rejects.toEqual(
      expect.objectContaining({ message: READ_DENIED }),
    );
    expect(studentsService.getStudentsGrades).not.toHaveBeenCalled();
  });

  it('refuses a teacher whose courses the student does not take', async () => {
    const { controller, studentsService } = buildController();
    studentsService.getStudentsGrades.mockResolvedValue([{ id: 'C2', grades: [] }]);
    await expect(controller.getStudentsGrades(caller('u-teacher', 'TEACHER') as never, 'ana')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('students API — enrollment codes', () => {
  it('are omitted from every Prisma query by default', () => {
    expect(OMITTED_BY_DEFAULT.student).toEqual({ enrollmentCode: true, enrollmentCodeGeneratedAt: true });
    const client = new PrismaService() as unknown as { options: { omit: unknown } };
    expect(client.options.omit).toBe(OMITTED_BY_DEFAULT);
  });

  it.each([
    ['a teacher', caller('u-teacher', 'TEACHER')],
    ['a student', caller('u-ana', 'STUDENT')],
    ['an admin of another organization', caller('u-admin', 'ORG_ADMIN', 'org-2')],
  ])('student detail hides the code from %s', async (_who, req) => {
    const { controller, studentsService } = buildController();
    const student = await controller.findOne(req as never, 'ana');
    expect(student).not.toHaveProperty('enrollmentCode');
    expect(studentsService.getEnrollmentCode).not.toHaveBeenCalled();
  });

  it('student detail shows the code to an admin of the organization', async () => {
    const { controller } = buildController();
    const student = await controller.findOne(caller('u-admin', 'ORG_ADMIN') as never, 'ana');
    expect(student).toMatchObject({ enrollmentCode: 'ABCD1234', enrollmentCodeGeneratedAt: 'then' });
  });

  it('the code endpoint needs MANAGE_STUDENTS; grade routes need VIEW_GRADES', () => {
    const meta = (name: keyof StudentsController) =>
      Reflect.getMetadata(PERMISSIONS_KEY, StudentsController.prototype[name] as object);
    expect(meta('getEnrollmentCode')).toEqual([Perm.MANAGE_STUDENTS]);
    expect(meta('regenerateEnrollmentCode')).toEqual([Perm.MANAGE_STUDENTS]);
    expect(meta('getStudentsGrades')).toEqual([Perm.VIEW_GRADES]);
    expect(meta('getAverageScoreForStudent')).toEqual([Perm.VIEW_GRADES]);
  });

  describe('StudentsService', () => {
    function buildService(organizationId: string | null) {
      const prisma = {
        student: {
          findUnique: jest.fn().mockResolvedValue({ organizationId: 'org-1' }),
          findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'ana', enrollmentCode: 'ABCD1234' }),
          update: jest.fn(),
        },
      };
      const request = { user: { userId: 'u-admin', organizationId } };
      const service = new StudentsService(prisma as never, {} as never, {} as never, {} as never, request as never);
      return { service, prisma };
    }

    it('returns the code to an admin of the same organization', async () => {
      const { service } = buildService('org-1');
      await expect(service.getEnrollmentCode('ana')).resolves.toMatchObject({ enrollmentCode: 'ABCD1234' });
    });

    it('refuses to read or regenerate the code of another organization', async () => {
      const { service, prisma } = buildService('org-2');
      await expect(service.getEnrollmentCode('ana')).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.regenerateEnrollmentCode('ana')).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.student.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(prisma.student.update).not.toHaveBeenCalled();
    });
  });
});

describe('Prisma client — credentials are never part of a default result (PPL-001 Q1)', () => {
  it('omits password hashes and OAuth tokens from every query', () => {
    expect(OMITTED_BY_DEFAULT.user).toEqual({ password: true });
    expect(OMITTED_BY_DEFAULT.account).toEqual({ password: true, accessToken: true, refreshToken: true, idToken: true });
    const client = new PrismaService() as unknown as { options: { omit: typeof OMITTED_BY_DEFAULT } };
    expect(client.options.omit.user.password).toBe(true);
  });
});

describe('students API — lists and records are scoped to staff, self and linked parents', () => {
  it.each([
    ['a student', caller('u-ana', 'STUDENT')],
    ['a parent', caller('u-parent', 'PARENT')],
  ])('refuses every list to %s', async (_who, req) => {
    const { controller, studentsService } = buildController();
    const denied = expect.objectContaining({ message: STUDENT_DENIED });
    await expect(controller.findAll(req as never, {} as never)).rejects.toEqual(denied);
    await expect(controller.findManyStudentsCount(req as never, {} as never)).rejects.toEqual(denied);
    await expect(controller.findManyBySchoolId(req as never, 'SC1')).rejects.toEqual(denied);
    await expect(controller.findManyByClassGroupId(req as never, 'G1')).rejects.toEqual(denied);
    expect(studentsService.findAll).not.toHaveBeenCalled();
    expect(studentsService.findManyBySchoolId).not.toHaveBeenCalled();
    expect(studentsService.findManyByClassGroupId).not.toHaveBeenCalled();
  });

  it.each([
    ['a teacher', caller('u-teacher', 'TEACHER')],
    ['an admin', caller('u-admin', 'ORG_ADMIN')],
  ])('lets %s list', async (_who, req) => {
    const { controller } = buildController();
    await expect(controller.findManyBySchoolId(req as never, 'SC1')).resolves.toEqual([]);
    await expect(controller.findManyByClassGroupId(req as never, 'G1')).resolves.toEqual([]);
  });

  it("filters a course's students by the caller's read scope", async () => {
    const { controller } = buildController();
    const readScope = jest.spyOn(GradeAccessService.prototype, 'readScope');
    readScope.mockResolvedValueOnce({ courseId: 'C1', staff: false, studentIds: ['ana'] });
    const own = await controller.findManyByCourseId(caller('u-ana', 'STUDENT') as never, 'C1');
    expect(own.map((s) => s.id)).toEqual(['ana']);

    readScope.mockResolvedValueOnce({ courseId: 'C1', staff: true, studentIds: null });
    const all = await controller.findManyByCourseId(caller('u-teacher', 'TEACHER') as never, 'C1');
    expect(all.map((s) => s.id)).toEqual(['ana', 'bob']);

    readScope.mockRejectedValueOnce(new ForbiddenException(READ_DENIED));
    await expect(controller.findManyByCourseId(caller('u-x', 'TEACHER', 'org-2') as never, 'C1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    readScope.mockRestore();
  });

  describe('StudentsService', () => {
    const ana = { organizationId: 'org-1', schoolId: 'SC1', userId: 'u-ana', parents: [] as { id: string }[] };

    function buildService(user: { userId: string; role: string; organizationId: string | null }) {
      const prisma = {
        student: {
          findUnique: jest.fn(async ({ select }: { select?: { parents?: { where: { userId: string } } } }) => {
            const linked = select?.parents?.where.userId === 'u-parent';
            return { ...ana, parents: linked ? [{ id: 'p1' }] : [] };
          }),
          findUniqueOrThrow: jest.fn(async () => ana),
          findMany: jest.fn(async () => []),
          update: jest.fn(),
          delete: jest.fn(),
        },
        school: { findFirst: jest.fn(async ({ where }: { where: { id: string; organizationId: string } }) =>
          where.id === 'SC1' && where.organizationId === 'org-1' ? { id: 'SC1' } : null) },
        classGroup: { findFirst: jest.fn(async ({ where }: { where: { id: string; organizationId: string } }) =>
          where.id === 'G1' && where.organizationId === 'org-1' ? { id: 'G1' } : null) },
        role: { findFirstOrThrow: jest.fn() },
      };
      const service = new StudentsService(prisma as never, {} as never, {} as never, {} as never, { user } as never);
      return { service, prisma };
    }

    it.each([
      ['staff of the organization', { userId: 'u-teacher', role: 'TEACHER', organizationId: 'org-1' }],
      ['the student', { userId: 'u-ana', role: 'STUDENT', organizationId: 'org-1' }],
      ['a linked parent, from any organization', { userId: 'u-parent', role: 'PARENT', organizationId: 'org-9' }],
    ])('lets %s read the record', async (_who, user) => {
      await expect(buildService(user).service.assertCanRead('ana')).resolves.toBeUndefined();
    });

    it.each([
      ['staff of another organization', { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-2' }],
      ['a classmate', { userId: 'u-bob', role: 'STUDENT', organizationId: 'org-1' }],
      ['an unlinked parent', { userId: 'u-other', role: 'PARENT', organizationId: 'org-1' }],
    ])('refuses the record to %s', async (_who, user) => {
      await expect(buildService(user).service.assertCanRead('ana')).rejects.toEqual(
        expect.objectContaining({ message: STUDENT_DENIED }),
      );
    });

    it("lists only the caller's organization", async () => {
      const { service, prisma } = buildService({ userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' });
      await service.findManyBySchoolId('SC2');
      await service.findManyByClassGroupId('G2');
      for (const [args] of prisma.student.findMany.mock.calls as unknown as [{ where: Record<string, unknown> }][]) {
        expect(args.where).toMatchObject({ organizationId: 'org-1' });
      }
    });

    it("creates in the caller's organization only, and refuses a school or group outside it", async () => {
      const { service, prisma } = buildService({ userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' });
      const body = { organizationId: 'org-2', schoolId: 'SC2', firstName: 'X', fatherName: 'Y', birthDate: new Date() };
      await expect(service.create(body as never)).rejects.toEqual(expect.objectContaining({ message: REFS_DENIED }));
      await expect(service.create({ ...body, schoolId: 'SC1', classGroupId: 'G2' } as never)).rejects.toEqual(
        expect.objectContaining({ message: REFS_DENIED }),
      );
      expect(prisma.role.findFirstOrThrow).not.toHaveBeenCalled();
    });

    it("refuses to change, delete or attach a login to another organization's student", async () => {
      const { service, prisma } = buildService({ userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-2' });
      await expect(service.update('ana', { id: 'ana', firstName: 'Hack' } as never)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.remove('ana')).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.attachUser('ana', { email: 'x@y.z' })).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.student.update).not.toHaveBeenCalled();
      expect(prisma.student.delete).not.toHaveBeenCalled();
    });

    it("refuses moving a student into another organization's class group", async () => {
      const { service, prisma } = buildService({ userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' });
      await expect(service.update('ana', { id: 'ana', classGroupId: 'G2' } as never)).rejects.toEqual(
        expect.objectContaining({ message: REFS_DENIED }),
      );
      expect(prisma.student.update).not.toHaveBeenCalled();
    });
  });
});
