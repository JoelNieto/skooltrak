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
jest.mock('./periods/periods.service', () => ({ PeriodsService: class {} }));
jest.mock('./degrees/degrees.service', () => ({ DegreesService: class {} }));
jest.mock('./study-plans/study-plans.service', () => ({ StudyPlansService: class {} }));
jest.mock('./groups-schedules/groups-schedules.service', () => ({ GroupsSchedulesService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import { DegreesController } from './degrees/degrees.controller';
import { COURSE_MISMATCH, GROUP_DENIED, GroupsSchedulesController } from './groups-schedules/groups-schedules.controller';
import { SCHOOL_DENIED } from './org-scope';
import { PERIODS_PLATFORM_ONLY, PeriodsController } from './periods/periods.controller';
import { DEGREE_MISMATCH, StudyPlansController } from './study-plans/study-plans.controller';

/**
 * Periods, degrees, study plans and group schedules check permission and organization. Runs the
 * real controllers against an in-memory stand-in for the Prisma lookups they make.
 */

// Org 1: school SCH1 (degree D1, plan P1, group G1 with student S1 and parent u-parent, course C1).
// Org 2: school SCH9 (degree D9, plan P9, group G9, course C9, slot W9).
const schools = [
  { id: 'SCH1', organizationId: 'org-1' },
  { id: 'SCH9', organizationId: 'org-2' },
];
const degrees = [
  { id: 'D1', schoolId: 'SCH1' },
  { id: 'D9', schoolId: 'SCH9' },
];
const plans = [
  { id: 'P1', schoolId: 'SCH1', degreeId: 'D1' },
  { id: 'P9', schoolId: 'SCH9', degreeId: 'D9' },
];
const groups = [
  { id: 'G1', organizationId: 'org-1', schoolId: 'SCH1' },
  { id: 'G9', organizationId: 'org-2', schoolId: 'SCH9' },
];
const courses = [
  { id: 'C1', organizationId: 'org-1', schoolId: 'SCH1' },
  { id: 'C9', organizationId: 'org-2', schoolId: 'SCH9' },
];
const slots = [
  { id: 'W1', classGroupId: 'G1', courseId: 'C1' },
  { id: 'W9', classGroupId: 'G9', courseId: 'C9' },
];
const students = [{ classGroupId: 'G1', userId: 'u-s1', parentUserIds: ['u-parent'] }];

const byId =
  <T extends { id: string }>(rows: T[]) =>
  async ({ where }: { where: { id: string } }) =>
    rows.find((r) => r.id === where.id) ?? null;

const prisma = {
  school: { findUnique: byId(schools) },
  studyPlan: { findUnique: byId(plans) },
  classGroup: { findUnique: byId(groups) },
  classGroupWeeklySchedule: { findUnique: byId(slots) },
  degree: {
    findUnique: byId(degrees),
    count: async ({ where }: { where: { id: string; schoolId: string } }) =>
      degrees.filter((d) => d.id === where.id && d.schoolId === where.schoolId).length,
  },
  course: {
    count: async ({ where }: { where: { id: string; organizationId: string; schoolId: string } }) =>
      courses.filter(
        (c) => c.id === where.id && c.organizationId === where.organizationId && c.schoolId === where.schoolId,
      ).length,
  },
  student: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count: async ({ where }: { where: any }) =>
      students.filter(
        (s) =>
          s.classGroupId === where.classGroupId &&
          (!where.userId || s.userId === where.userId) &&
          (!where.parents || s.parentUserIds.includes(where.parents.some.userId)),
      ).length,
  },
};

const user = (userId: string, role: string, organizationId: string | null = 'org-1') =>
  ({ user: { userId, role, organizationId, permissions: [] } }) as never;
const admin = user('u-admin', 'ORG_ADMIN');
const teacher = user('u-teacher', 'TEACHER');
const student = user('u-s1', 'STUDENT');
const parent = user('u-parent', 'PARENT', null);
const sysadmin = user('u-sys', 'SYSADMIN');

const mockService = () =>
  new Proxy({} as Record<string, jest.Mock>, {
    get: (target, key: string) => (target[key] ??= jest.fn(async () => ({}))),
  });
const perms = (target: object) => Reflect.getMetadata(PERMISSIONS_KEY, target) as Perm[] | undefined;

describe('Academic setup access', () => {
  it('periods: anyone signed in reads, only SYSADMIN writes', async () => {
    const service = mockService();
    const controller = new PeriodsController(service as never, prisma as never);
    for (const req of [admin, teacher]) {
      await expect(controller.create(req, {} as never)).rejects.toThrow(new ForbiddenException(PERIODS_PLATFORM_ONLY));
      await expect(controller.update(req, { id: 'x' } as never)).rejects.toThrow(ForbiddenException);
      await expect(controller.remove(req, 'x')).rejects.toThrow(ForbiddenException);
    }
    await controller.create(sysadmin, {} as never);
    expect(service['create']).toHaveBeenCalledTimes(1);
  });

  it('school period overrides: VIEW/MANAGE_PERIODS, own organization only', async () => {
    const service = mockService();
    const controller = new PeriodsController(service as never, prisma as never);
    expect(perms(controller.schoolPeriods)).toEqual([Perm.VIEW_PERIODS]);
    expect(perms(controller.setOverride)).toEqual([Perm.MANAGE_PERIODS]);
    expect(perms(controller.clearOverride)).toEqual([Perm.MANAGE_PERIODS]);

    await expect(controller.schoolPeriods(admin, 'SCH9', '2026')).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
    await expect(controller.setOverride(admin, 'SCH9', 'p1', {})).rejects.toThrow(ForbiddenException);
    await expect(controller.clearOverride(admin, 'SCH9', 'p1')).rejects.toThrow(ForbiddenException);
    await expect(controller.findManyByYear(teacher, '2026', 'SCH9')).rejects.toThrow(ForbiddenException);
    expect(service['setOverride']).not.toHaveBeenCalled();

    await controller.setOverride(admin, 'SCH1', 'p1', { name: 'T1' });
    expect(service['setOverride']).toHaveBeenCalledWith('SCH1', 'p1', { name: 'T1' });
    await controller.findManyByYear(teacher, '2026', 'SCH1');
    expect(service['findManyByYear']).toHaveBeenCalledWith(2026, 'SCH1');
  });

  it('degrees: VIEW/MANAGE_STUDY_PLANS, own organization only', async () => {
    const service = mockService();
    service['ref'] = jest.fn(async (id: string) => degrees.find((d) => d.id === id));
    const controller = new DegreesController(service as never, prisma as never);
    expect(perms(DegreesController)).toEqual([Perm.VIEW_STUDY_PLANS]);
    expect(perms(controller.create)).toEqual([Perm.MANAGE_STUDY_PLANS]);

    await expect(controller.create(admin, { schoolId: 'SCH9' } as never)).rejects.toThrow(
      new ForbiddenException(SCHOOL_DENIED),
    );
    await expect(controller.findManyBySchoolId(teacher, 'SCH9')).rejects.toThrow(ForbiddenException);
    await expect(controller.findOne(teacher, 'D9')).rejects.toThrow(ForbiddenException);
    await expect(controller.update(admin, { id: 'D9', name: 'x' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.update(admin, { id: 'D1', schoolId: 'SCH9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.remove(admin, 'D9')).rejects.toThrow(ForbiddenException);

    await controller.findAll(admin);
    expect(service['findAll']).toHaveBeenCalledWith('org-1');
    await controller.update(admin, { id: 'D1', name: 'Primaria' } as never);
    expect(service['update']).toHaveBeenCalledTimes(1);
  });

  it("study plans: own organization only, and the degree must be the plan's school's", async () => {
    const service = mockService();
    const controller = new StudyPlansController(service as never, prisma as never);
    expect(perms(StudyPlansController)).toEqual([Perm.VIEW_STUDY_PLANS]);
    expect(perms(controller.update)).toEqual([Perm.MANAGE_STUDY_PLANS]);

    await expect(controller.create(admin, { schoolId: 'SCH9', degreeId: 'D9' } as never)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(controller.create(admin, { schoolId: 'SCH1', degreeId: 'D9' } as never)).rejects.toThrow(
      new BadRequestException(DEGREE_MISMATCH),
    );
    await expect(controller.findAll(teacher, { schoolId: 'SCH9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.findAllBySchoolId(teacher, 'SCH9')).rejects.toThrow(ForbiddenException);
    await expect(controller.findOne(teacher, 'P9')).rejects.toThrow(ForbiddenException);
    await expect(controller.update(admin, { id: 'P1', degreeId: 'D9' } as never)).rejects.toThrow(BadRequestException);
    await expect(controller.remove(admin, 'P9')).rejects.toThrow(ForbiddenException);

    await controller.create(admin, { schoolId: 'SCH1', degreeId: 'D1' } as never);
    await controller.update(admin, { id: 'P1', name: 'Nuevo' } as never);
    expect(service['create']).toHaveBeenCalledTimes(1);
    expect(service['update']).toHaveBeenCalledTimes(1);
  });

  it("group schedules: staff, the group's students and their parents read; writes stay in the group's school", async () => {
    const service = mockService();
    const controller = new GroupsSchedulesController(service as never, prisma as never);
    expect(perms(GroupsSchedulesController)).toEqual([Perm.VIEW_SCHEDULES]);
    expect(perms(controller.create)).toEqual([Perm.MANAGE_SCHEDULES]);
    expect(perms(controller.findAll)).toEqual([Perm.MANAGE_SCHEDULES]);

    for (const req of [admin, teacher, student, parent]) await controller.findAllByClassGroupId(req, 'G1');
    expect(service['findAllByClassGroupId']).toHaveBeenCalledTimes(4);
    await expect(controller.findAllByClassGroupId(teacher, 'G9')).rejects.toThrow(new ForbiddenException(GROUP_DENIED));
    await expect(controller.findOne(student, 'W9')).rejects.toThrow(ForbiddenException);
    await expect(controller.findAllByClassGroupIdGrouped(user('u-other', 'PARENT', null), 'G1')).rejects.toThrow(
      ForbiddenException,
    );

    await expect(controller.create(admin, { classGroupId: 'G9', courseId: 'C9' } as never)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(controller.create(admin, { classGroupId: 'G1', courseId: 'C9' } as never)).rejects.toThrow(
      new BadRequestException(COURSE_MISMATCH),
    );
    await expect(controller.update(admin, { id: 'W9', weekday: 'MONDAY' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.update(admin, { id: 'W1', classGroupId: 'G9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(controller.remove(admin, 'W9')).rejects.toThrow(ForbiddenException);

    await controller.create(admin, { classGroupId: 'G1', courseId: 'C1' } as never);
    await controller.update(admin, { id: 'W1', weekday: 'MONDAY' } as never);
    await controller.findAll(admin);
    expect(service['findAll']).toHaveBeenCalledWith('org-1');
  });
});
