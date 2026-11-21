jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
// The DTOs pull in @/shared, whose barrel loads Angular's ESM build.
jest.mock('@/shared', () => ({ TransformDateToNoon: () => () => undefined }));

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Perm, PERMISSIONS_KEY } from '@/auth';
import { AttendanceController } from './attendance.controller';
import {
  ATTENDANCE_DENIED,
  AttendanceService,
  RECORDS_NOT_ENROLLED,
  STUDENT_ATTENDANCE_DENIED,
} from './attendance.service';

/**
 * Attendance is scoped to the course's organization and to the people who may see it:
 * - a course's sessions and form: an admin of the course's organization or the course's teacher;
 * - one student's records and stats: staff of their organization, the student, or a linked parent.
 *
 * Org 1: course C1 (teacher u-teacher), group G1, student ana (u-ana, parent u-parent).
 * Org 2: course C2 (teacher u-t2), group G2.
 */
const courses: Record<string, { organizationId: string; teacher: { userId: string } | null }> = {
  C1: { organizationId: 'org-1', teacher: { userId: 'u-teacher' } },
  C2: { organizationId: 'org-2', teacher: { userId: 'u-t2' } },
};
const groups: Record<string, string> = { G1: 'org-1', G2: 'org-2' };
const sessions: Record<string, { courseId: string }> = { S1: { courseId: 'C1' }, S2: { courseId: 'C2' } };
const records: Record<string, { attendanceSession: { courseId: string } }> = {
  R1: { attendanceSession: { courseId: 'C1' } },
  R2: { attendanceSession: { courseId: 'C2' } },
};

function setup(user: { userId: string; role: string; organizationId: string | null }, enrolledCount = 1) {
  const prisma = {
    course: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => courses[where.id] ?? null),
    },
    classGroup: {
      findFirst: jest.fn(async ({ where }: { where: { id: string; organizationId: string } }) =>
        groups[where.id] === where.organizationId ? { id: where.id } : null,
      ),
    },
    student: {
      count: jest.fn(async () => enrolledCount),
      findMany: jest.fn(async () => []),
      findUnique: jest.fn(async ({ select }: { select: { parents: { where: { userId: string } } } }) => ({
        organizationId: 'org-1',
        userId: 'u-ana',
        parents: select.parents.where.userId === 'u-parent' ? [{ id: 'p1' }] : [],
      })),
    },
    teacher: { findUnique: jest.fn(async () => ({ id: 'T1' })) },
    attendanceSession: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string } }) => (where.id ? (sessions[where.id] ?? null) : null)),
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
      create: jest.fn(async () => ({ id: 'S-new' })),
      delete: jest.fn(),
    },
    attendanceRecord: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => records[where.id] ?? null),
      findMany: jest.fn(async ({ where }: { where: { id?: { in: string[] }; studentId?: string } }) =>
        where.id ? where.id.in.filter((id) => records[id]).map((id) => records[id]) : [],
      ),
      update: jest.fn(),
      count: jest.fn(async () => 0),
    },
    $transaction: jest.fn(async (ops: unknown[]) => ops),
  };
  const service = new AttendanceService(prisma as never, { user } as never);
  return { service, prisma };
}

const teacher = { userId: 'u-teacher', role: 'TEACHER', organizationId: 'org-1' };
const admin = { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' };
const denied = expect.objectContaining({ message: ATTENDANCE_DENIED });

describe("attendance — a course's sessions and form", () => {
  it.each([
    ['the course teacher', teacher],
    ['an admin of the organization', admin],
  ])('%s reads sessions, counts and the form', async (_who, user) => {
    const { service } = setup(user);
    await expect(service.findAll({ courseId: 'C1' } as never)).resolves.toEqual([]);
    await expect(service.count({ courseId: 'C1' } as never)).resolves.toBe(0);
    await expect(service.getStudentsForAttendance('C1', 'G1')).resolves.toEqual([]);
  });

  it.each([
    ['another teacher', { userId: 'u-other', role: 'TEACHER', organizationId: 'org-1' }],
    ['a student', { userId: 'u-ana', role: 'STUDENT', organizationId: 'org-1' }],
    ['a parent', { userId: 'u-parent', role: 'PARENT', organizationId: 'org-1' }],
    ['an admin of another organization', { ...admin, organizationId: 'org-2' }],
  ])('%s is refused', async (_who, user) => {
    const { service, prisma } = setup(user);
    await expect(service.findAll({ courseId: 'C1' } as never)).rejects.toEqual(denied);
    await expect(service.count({ courseId: 'C1' } as never)).rejects.toEqual(denied);
    await expect(service.findOne('S1')).rejects.toEqual(denied);
    await expect(service.getStudentsForAttendance('C1', 'G1')).rejects.toEqual(denied);
    expect(prisma.attendanceSession.findMany).not.toHaveBeenCalled();
    expect(prisma.student.findMany).not.toHaveBeenCalled();
  });

  it('requires a course to list sessions', async () => {
    const { service } = setup(admin);
    await expect(service.findAll({} as never)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.count({} as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('the form students route needs MANAGE_ATTENDANCE', () => {
    const meta = Reflect.getMetadata(PERMISSIONS_KEY, AttendanceController.prototype.getStudentsForAttendance);
    expect(meta).toEqual([Perm.MANAGE_ATTENDANCE]);
  });
});

describe('attendance — writes', () => {
  const input = { courseId: 'C1', classGroupId: 'G1', date: new Date(), records: [{ studentId: 'ana', status: 'PRESENT' }] };

  it('the course teacher takes attendance for enrolled students of the group', async () => {
    const { service, prisma } = setup(teacher);
    await service.create(input as never);
    expect(prisma.attendanceSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: 'org-1', courseId: 'C1' }) }),
    );
  });

  it("refuses another organization's class group", async () => {
    const { service, prisma } = setup(teacher);
    await expect(service.create({ ...input, classGroupId: 'G2' } as never)).rejects.toEqual(denied);
    expect(prisma.attendanceSession.create).not.toHaveBeenCalled();
  });

  it('refuses records for students not enrolled in the course and group', async () => {
    const { service, prisma } = setup(teacher, 0);
    await expect(service.create(input as never)).rejects.toEqual(expect.objectContaining({ message: RECORDS_NOT_ENROLLED }));
    expect(prisma.attendanceSession.create).not.toHaveBeenCalled();
  });

  it("refuses a teacher of another course, and an admin of another organization's course", async () => {
    const { service } = setup({ userId: 'u-other', role: 'TEACHER', organizationId: 'org-1' });
    await expect(service.create(input as never)).rejects.toEqual(denied);
    await expect(service.remove('S1')).rejects.toEqual(denied);
    await expect(setup(admin).service.remove('S2')).rejects.toEqual(denied);
  });

  it('checks every record of a batch, not only the first', async () => {
    const { service, prisma } = setup(teacher);
    await expect(
      service.updateManyRecords([
        { id: 'R1', status: 'ABSENT' },
        { id: 'R2', status: 'ABSENT' },
      ] as never),
    ).rejects.toEqual(denied);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('updates a batch of records of the own course', async () => {
    const { service, prisma } = setup(teacher);
    await service.updateManyRecords([{ id: 'R1', status: 'ABSENT' }] as never);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

describe("attendance — one student's records and stats", () => {
  it.each([
    ['the student', { userId: 'u-ana', role: 'STUDENT', organizationId: 'org-1' }],
    ['a linked parent, from any organization', { userId: 'u-parent', role: 'PARENT', organizationId: 'org-9' }],
    ['a teacher of the organization', teacher],
    ['an admin of the organization', admin],
  ])('%s may read them', async (_who, user) => {
    const { service } = setup(user);
    await expect(service.getAttendanceByStudentId('ana')).resolves.toEqual([]);
    await expect(service.getStudentAttendanceStats('ana')).resolves.toMatchObject({ total: 0 });
  });

  it.each([
    ['a classmate', { userId: 'u-bob', role: 'STUDENT', organizationId: 'org-1' }],
    ['an unlinked parent', { userId: 'u-other', role: 'PARENT', organizationId: 'org-1' }],
    ['staff of another organization', { ...admin, organizationId: 'org-2' }],
  ])('%s is refused', async (_who, user) => {
    const { service, prisma } = setup(user);
    const refused = expect.objectContaining({ message: STUDENT_ATTENDANCE_DENIED });
    await expect(service.getAttendanceByStudentId('ana')).rejects.toEqual(refused);
    await expect(service.getStudentAttendanceStats('ana')).rejects.toEqual(refused);
    expect(prisma.attendanceRecord.findMany).not.toHaveBeenCalled();
    expect(prisma.attendanceRecord.count).not.toHaveBeenCalled();
  });

  it('refuses an anonymous caller', async () => {
    const service = new AttendanceService({} as never, {} as never);
    await expect(service.getAttendanceByStudentId('ana')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
