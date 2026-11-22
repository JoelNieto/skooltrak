import { BadRequestException, ForbiddenException } from '@nestjs/common';

// The `@/auth` barrel pulls in better-auth's ESM build, which this Jest setup can't parse. The
// controllers only need the guards, decorators and Perm enum, so serve those from source.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({
  ...jest.requireActual('../../../../libs/auth/src/lib/auth.guard'),
  ...jest.requireActual('../../../../libs/auth/src/lib/permissions/permissions.constants'),
}));
jest.mock('@/api-contracts', () => ({ FetchDataQueryDto: class {} }));
jest.mock('./prisma.service', () => ({ PrismaService: class {} }));
jest.mock('./class-groups/class-groups.service', () => ({ ClassGroupsService: class {} }));
jest.mock('./quizzes/quizzes.service', () => ({ QuizzesService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import { ClassGroupsController, GROUP_DENIED, PLAN_MISMATCH } from './class-groups/class-groups.controller';
import { SCHOOL_DENIED } from './org-scope';
import {
  QUIZ_DENIED,
  QuizzesController,
  TEACHER_MISMATCH,
  withoutAnswers,
  WRITE_DENIED,
} from './quizzes/quizzes.controller';

/**
 * Class groups and quizzes check permission, organization and (quizzes) course ownership. Runs the
 * real controllers against an in-memory stand-in for the Prisma lookups they make.
 */

// Org 1: school SCH1, plan P1, group G1, course C1 taught by teacher-1, quiz Q1.
// Org 2: school SCH9, plan P9, group G9, course C9, quiz Q9.
const schools = [
  { id: 'SCH1', organizationId: 'org-1' },
  { id: 'SCH9', organizationId: 'org-2' },
];
const plans = [
  { id: 'P1', schoolId: 'SCH1' },
  { id: 'P9', schoolId: 'SCH9' },
];
const groups = [
  { id: 'G1', organizationId: 'org-1', schoolId: 'SCH1', studyPlanId: 'P1' },
  { id: 'G9', organizationId: 'org-2', schoolId: 'SCH9', studyPlanId: 'P9' },
];
const courses = [
  { id: 'C1', organizationId: 'org-1', schoolId: 'SCH1', teacherId: 'teacher-1' },
  { id: 'C9', organizationId: 'org-2', schoolId: 'SCH9', teacherId: 'teacher-9' },
];
const teachers = [
  { id: 'teacher-1', userId: 'u-teacher', organizationId: 'org-1' },
  { id: 'teacher-2', userId: 'u-teacher2', organizationId: 'org-1' },
  { id: 'teacher-9', userId: 'u-teacher9', organizationId: 'org-2' },
];
const quizzes = [
  { id: 'Q1', organizationId: 'org-1', courseId: 'C1' },
  { id: 'Q9', organizationId: 'org-2', courseId: 'C9' },
];

const byId =
  <T extends { id: string }>(rows: T[]) =>
  async ({ where }: { where: { id: string } }) =>
    rows.find((r) => r.id === where.id) ?? null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countWhere = <T extends Record<string, unknown>>(rows: T[]) => async ({ where }: { where: any }) =>
  rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v)).length;

const students = [{ id: 'S1', userId: 'u-s1', organizationId: 'org-1', classGroupId: 'G1' }];

const prisma = {
  student: {
    findFirst: async ({ where }: { where: { userId: string; organizationId: string } }) =>
      students.find((st) => st.userId === where.userId && st.organizationId === where.organizationId) ?? null,
  },
  school: { findUnique: byId(schools) },
  classGroup: { findUnique: byId(groups) },
  course: { findUnique: byId(courses) },
  quiz: { findUnique: byId(quizzes) },
  studyPlan: { count: countWhere(plans) },
  teacher: {
    count: countWhere(teachers),
    findFirst: async ({ where }: { where: { userId: string; organizationId: string } }) =>
      teachers.find((t) => t.userId === where.userId && t.organizationId === where.organizationId) ?? null,
  },
};

const user = (userId: string, role: string, organizationId: string | null = 'org-1') =>
  ({ user: { userId, role, organizationId, permissions: [] } }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const teacher = user('u-teacher', 'TEACHER');
const colleague = user('u-teacher2', 'TEACHER');
const student = user('u-s1', 'STUDENT');

const mockService = () =>
  new Proxy({} as Record<string, jest.Mock>, {
    get: (target, key: string) => (target[key] ??= jest.fn(async () => ({}))),
  });
const perms = (target: object) => Reflect.getMetadata(PERMISSIONS_KEY, target) as Perm[] | undefined;

describe('Class group and quiz access', () => {
  it("class groups: VIEW/MANAGE_CLASS_GROUPS, the caller's organization only", async () => {
    const service = mockService();
    const controller = new ClassGroupsController(service as never, prisma as never);
    expect(perms(ClassGroupsController)).toEqual([Perm.VIEW_CLASS_GROUPS]);
    for (const write of [controller.create, controller.update, controller.remove]) {
      expect(perms(write)).toEqual([Perm.MANAGE_CLASS_GROUPS]);
    }

    await expect(controller.findOne(teacher, 'G9')).rejects.toThrow(new ForbiddenException(GROUP_DENIED));
    await expect(controller.findAll(teacher, { schoolId: 'SCH9' } as never)).rejects.toThrow(
      new ForbiddenException(SCHOOL_DENIED),
    );
    await expect(controller.findAllBySchoolId(student, 'SCH9')).rejects.toThrow(ForbiddenException);
    await expect(controller.findAllByCourseId(teacher, 'C9')).rejects.toThrow(ForbiddenException);
    await expect(controller.findAllByOrganizationId(admin, 'org-2')).rejects.toThrow(ForbiddenException);

    await controller.findAll(teacher, {} as never);
    expect(service['findAll']).toHaveBeenCalledWith({}, 'org-1', undefined);
    await controller.count(teacher, { schoolId: 'SCH1' } as never);
    expect(service['count']).toHaveBeenCalledWith({ schoolId: 'SCH1' }, 'org-1', undefined);
  });

  it("class group writes keep the group, plan and teacher in the caller's organization", async () => {
    const service = mockService();
    const controller = new ClassGroupsController(service as never, prisma as never);
    const input = { name: '8°C', schoolId: 'SCH1', studyPlanId: 'P1', teacherId: 'teacher-1', organizationId: 'org-2' };

    await controller.create(admin, input as never);
    expect(service['create']).toHaveBeenCalledWith({ ...input, organizationId: 'org-1' });
    await expect(controller.create(admin, { ...input, schoolId: 'SCH9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.create(admin, { ...input, studyPlanId: 'P9' } as never)).rejects.toThrow(
      new BadRequestException(PLAN_MISMATCH),
    );
    await expect(controller.create(admin, { ...input, teacherId: 'teacher-9' } as never)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.update(admin, { id: 'G9', name: 'x' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.update(admin, { id: 'G1', organizationId: 'org-2' } as never)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(controller.update(admin, { id: 'G1', schoolId: 'SCH9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.remove(admin, 'G9')).rejects.toThrow(ForbiddenException);
    await controller.update(admin, { id: 'G1', name: '8°A' } as never);
    expect(service['update']).toHaveBeenCalledTimes(1);
  });

  it("quizzes: reads stay in the caller's organization", async () => {
    const service = mockService();
    service['findOne'] = jest.fn(async () => ({ id: 'Q1', questions: [] }));
    const controller = new QuizzesController(service as never, prisma as never);
    expect(perms(QuizzesController)).toEqual([Perm.VIEW_QUIZZES]);
    for (const write of [controller.create, controller.update, controller.remove]) {
      expect(perms(write)).toEqual([Perm.MANAGE_QUIZZES]);
    }

    expect(() => controller.findAll(teacher, 'org-2')).toThrow(new ForbiddenException(QUIZ_DENIED));
    await controller.findAll(teacher);
    expect(service['findAll']).toHaveBeenCalledWith('org-1');
    await expect(controller.findOne(student, 'Q9')).rejects.toThrow(ForbiddenException);
    await controller.findOne(student, 'Q1');
    expect(service['findOne']).toHaveBeenCalledWith('Q1');
  });

  it("quiz writes need the course's teacher or an admin", async () => {
    const service = mockService();
    const controller = new QuizzesController(service as never, prisma as never);
    const input = { title: 'Q', courseId: 'C1', teacherId: 'teacher-1', organizationId: 'org-2' };

    await controller.create(teacher, input as never);
    expect(service['create']).toHaveBeenCalledWith({ ...input, organizationId: 'org-1' });
    for (const u of [colleague, student, user('u-admin9', 'ORG_ADMIN', 'org-2')]) {
      await expect(controller.create(u, input as never)).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
      await expect(controller.update(u, { id: 'Q1', title: 'x' } as never)).rejects.toThrow(ForbiddenException);
      await expect(controller.remove(u, 'Q1')).rejects.toThrow(ForbiddenException);
    }
    await expect(controller.create(admin, { ...input, teacherId: 'teacher-9' } as never)).rejects.toThrow(
      new BadRequestException(TEACHER_MISMATCH),
    );
    await expect(controller.update(teacher, { id: 'Q1', courseId: 'C9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.update(admin, { id: 'Q1', organizationId: 'org-2' } as never)).rejects.toThrow(
      ForbiddenException,
    );
    await controller.update(admin, { id: 'Q1', title: 'Nuevo' } as never);
    await controller.remove(teacher, 'Q1');
    expect(service['update']).toHaveBeenCalledTimes(1);
    expect(service['remove']).toHaveBeenCalledTimes(1);
  });

  it('students only see their own group, without classmates\' document ids', async () => {
    const service = mockService();
    service['findAllBySchoolId'] = jest.fn(async () => groups.filter((g) => g.organizationId === 'org-1').concat([
      { id: 'G2', organizationId: 'org-1', schoolId: 'SCH1', studyPlanId: 'P1' },
    ]));
    const controller = new ClassGroupsController(service as never, prisma as never);

    await controller.findOne(student, 'G1');
    expect(service['findOne']).toHaveBeenCalledWith('G1', 'S1');
    await controller.findOne(teacher, 'G1');
    expect(service['findOne']).toHaveBeenLastCalledWith('G1', undefined);
    groups.push({ id: 'G2', organizationId: 'org-1', schoolId: 'SCH1', studyPlanId: 'P1' });
    try {
      await expect(controller.findOne(student, 'G2')).rejects.toThrow(new ForbiddenException(GROUP_DENIED));
    } finally {
      groups.pop();
    }
    await expect(controller.findOne(user('u-nostudent', 'STUDENT'), 'G1')).rejects.toThrow(ForbiddenException);

    await controller.findAll(student, {} as never);
    expect(service['findAll']).toHaveBeenLastCalledWith({}, 'org-1', ['G1']);
    await controller.findAll(teacher, {} as never);
    expect(service['findAll']).toHaveBeenLastCalledWith({}, 'org-1', undefined);
    expect((await controller.findAllBySchoolId(student, 'SCH1')).map((g) => g.id)).toEqual(['G1']);
    expect((await controller.findAllBySchoolId(teacher, 'SCH1')).map((g) => g.id)).toEqual(['G1', 'G2']);
  });

  it("only the course's teacher and admins see a quiz's correct options", async () => {
    const service = mockService();
    const quiz = { id: 'Q1', questions: [{ id: 'q', options: [{ id: 'o1', option: 'A', isCorrect: true }] }] };
    service['findOne'] = jest.fn(async () => quiz);
    const controller = new QuizzesController(service as never, prisma as never);

    for (const u of [teacher, admin]) expect(await controller.findOne(u, 'Q1')).toBe(quiz);
    for (const u of [student, colleague]) {
      const seen = await controller.findOne(u, 'Q1');
      expect(seen).toEqual(withoutAnswers(quiz));
      expect(seen?.questions[0].options[0]).not.toHaveProperty('isCorrect');
    }
  });
});
