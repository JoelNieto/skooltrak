import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AssignmentType, AttendanceStatus, WeekDay } from '@generated/prisma';
import { periodClose, slotState, TeacherHomeService } from './teacher-home.service';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

/** HOM-001-S01: teacher "Mi día" and the scoped attendance KPI. */
describe('TeacherHomeService (HOM-001-S01)', () => {
  const ORG = 'org-1';
  const SCHOOL = 'school-1';
  const TEACHER_ID = 'teacher-1';
  const RELATED = { studyPlan: { courses: { some: { teacherId: TEACHER_ID } } } };
  const user = { userId: 'user-1', organizationId: ORG, role: 'TEACHER' };
  // Monday 16 Nov 2026, 09:15 in Panama.
  const NOW = new Date('2026-11-16T14:15:00Z');

  const slot = (id: string, startTime: string, endTime: string, extra: Record<string, unknown> = {}) => ({
    id,
    startTime,
    endTime,
    location: 'Aula 12',
    remote: false,
    remoteLink: '',
    recess: false,
    course: { id: 'c-math', name: 'Matemáticas' },
    classGroup: { id: 'cg-7a', name: '7°A' },
    ...extra,
  });

  function build(
    opts: {
      school?: unknown;
      teacher?: unknown;
      slots?: unknown[];
      sessions?: unknown[];
      records?: { attendanceSessionId: string; status: AttendanceStatus; _count: { _all: number } }[];
      periods?: unknown[];
      toReview?: { assignmentId: string; _count: { _all: number }; _min: { submittedAt: Date | null } }[];
      courses?: { id: string; _count: { students: number } }[];
      grades?: { courseId: string; published: boolean; _count: { studentGrades: number } }[];
      assignmentDates?: unknown[];
      students?: unknown[];
      submissions?: { assignmentId: string; studentId: string }[];
    } = {},
  ) {
    const prisma = {
      school: {
        findFirst: jest
          .fn()
          .mockResolvedValue(
            opts.school === undefined ? { id: SCHOOL, currentYear: 2026, timezone: 'America/Panama' } : opts.school,
          ),
      },
      teacher: {
        findFirst: jest
          .fn()
          .mockResolvedValue(opts.teacher === undefined ? { id: TEACHER_ID, firstName: 'Carlos' } : opts.teacher),
      },
      period: {
        findMany: jest.fn().mockResolvedValue(
          opts.periods ?? [
            {
              id: 'p2',
              name: 'II Trimestre',
              startDate: new Date('2026-09-01T05:00:00Z'),
              endDate: new Date('2026-11-27T05:00:00Z'),
            },
          ],
        ),
      },
      classGroupWeeklySchedule: { findMany: jest.fn().mockResolvedValue(opts.slots ?? []) },
      attendanceSession: { findMany: jest.fn().mockResolvedValue(opts.sessions ?? []) },
      attendanceRecord: { groupBy: jest.fn().mockResolvedValue(opts.records ?? []) },
      assignmentSubmission: {
        groupBy: jest.fn().mockResolvedValue(opts.toReview ?? []),
        findMany: jest.fn().mockResolvedValue(opts.submissions ?? []),
      },
      assignment: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'as-1', title: 'Proyecto Funciones', course: { name: 'Matemáticas' } }),
      },
      course: { findMany: jest.fn().mockResolvedValue(opts.courses ?? []) },
      grade: { findMany: jest.fn().mockResolvedValue(opts.grades ?? []) },
      assignmentDate: { findMany: jest.fn().mockResolvedValue(opts.assignmentDates ?? []) },
      student: { findMany: jest.fn().mockResolvedValue(opts.students ?? []) },
    };
    const service = new TeacherHomeService(prisma as never, { now: () => NOW });
    return { service, prisma };
  }

  describe('today', () => {
    it("lists today's slots of the teacher's courses with their state and attendance", async () => {
      const { service, prisma } = build({
        slots: [
          slot('s1', '07:00', '07:45'),
          slot('s2', '08:00', '08:45', { classGroup: { id: 'cg-7b', name: '7°B' } }),
          slot('s3', '08:45', '09:00', { recess: true }),
          slot('s4', '09:00', '10:30', { classGroup: { id: 'cg-7c', name: '7°C' } }),
          slot('s5', '13:00', '13:45', {
            remote: true,
            remoteLink: 'https://meet.test/x',
            classGroup: { id: 'cg-7d', name: '7°D' },
          }),
        ],
        sessions: [{ id: 'sess-1', courseId: 'c-math', classGroupId: 'cg-7a' }],
        records: [
          { attendanceSessionId: 'sess-1', status: AttendanceStatus.PRESENT, _count: { _all: 28 } },
          { attendanceSessionId: 'sess-1', status: AttendanceStatus.LATE, _count: { _all: 1 } },
          { attendanceSessionId: 'sess-1', status: AttendanceStatus.ABSENT, _count: { _all: 2 } },
        ],
      });

      const today = await service.today(user, SCHOOL);

      expect(prisma.classGroupWeeklySchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            weekday: WeekDay.MONDAY,
            course: { organizationId: ORG, schoolId: SCHOOL, teacherId: TEACHER_ID },
            classGroup: { organizationId: ORG, active: true, ...RELATED },
          },
        }),
      );
      expect(prisma.attendanceSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG, date: new Date('2026-11-16T00:00:00.000Z') }),
        }),
      );
      expect(today.slots.map((s) => [s.id, s.state])).toEqual([
        ['s1', 'DONE'],
        ['s2', 'MISSED'],
        ['s3', 'PAST'],
        ['s4', 'NOW'],
        ['s5', 'LATER'],
      ]);
      expect(today.slots[0].attendance).toEqual({ sessionId: 'sess-1', presentOrLate: 29, total: 31 });
      expect(today.pendingAttendance).toBe(2); // s2 missed, s4 now
      expect(today).toMatchObject({
        firstName: 'Carlos',
        date: '2026-11-16',
        time: '09:15',
        timezone: 'America/Panama',
        period: { id: 'p2', name: 'II Trimestre', endDate: '2026-11-27' },
      });
    });

    it('skips the attendance queries when there are no classes today', async () => {
      const { service, prisma } = build({ slots: [] });

      const today = await service.today(user, SCHOOL);

      expect(today.slots).toEqual([]);
      expect(prisma.attendanceSession.findMany).not.toHaveBeenCalled();
      expect(prisma.attendanceRecord.groupBy).not.toHaveBeenCalled();
    });

    it('refuses a user with no teacher record in the organization', async () => {
      const { service } = build({ teacher: null });

      await expect(service.today(user, SCHOOL)).rejects.toThrow(
        new ForbiddenException('No teacher profile in this organization'),
      );
    });

    it("refuses a school outside the caller's organization", async () => {
      const { service, prisma } = build({ school: null });

      await expect(service.today(user, 'school-other-org')).rejects.toThrow(ForbiddenException);
      expect(prisma.school.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'school-other-org', organizationId: ORG } }),
      );
      expect(prisma.classGroupWeeklySchedule.findMany).not.toHaveBeenCalled();
    });

    it('requires an organization context and a schoolId', async () => {
      const { service } = build();

      await expect(service.today({ ...user, organizationId: null }, SCHOOL)).rejects.toThrow(ForbiddenException);
      await expect(service.today(user, undefined)).rejects.toThrow(BadRequestException);
      await expect(service.today(undefined, SCHOOL)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('summary', () => {
    it("rates the week of the teacher's classes and names the lowest group", async () => {
      const { service, prisma } = build({
        sessions: [
          { id: 'a', classGroup: { id: 'cg-7a', name: '7°A' } },
          { id: 'b', classGroup: { id: 'cg-7b', name: '7°B' } },
        ],
        records: [
          { attendanceSessionId: 'a', status: AttendanceStatus.PRESENT, _count: { _all: 45 } },
          { attendanceSessionId: 'a', status: AttendanceStatus.EXCUSED, _count: { _all: 3 } },
          { attendanceSessionId: 'b', status: AttendanceStatus.PRESENT, _count: { _all: 35 } },
          { attendanceSessionId: 'b', status: AttendanceStatus.LATE, _count: { _all: 2 } },
          { attendanceSessionId: 'b', status: AttendanceStatus.ABSENT, _count: { _all: 5 } },
        ],
      });

      const summary = await service.summary(user, SCHOOL);

      expect(prisma.attendanceSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: ORG,
            date: { gte: new Date('2026-11-16T00:00:00.000Z'), lte: new Date('2026-11-22T00:00:00.000Z') },
            course: { schoolId: SCHOOL, teacherId: TEACHER_ID },
            classGroup: RELATED,
          },
        }),
      );
      expect(summary.weekStart).toBe('2026-11-16');
      expect(summary.attendance.rate).toBeCloseTo(82 / 87);
      expect(summary.attendance.lowestGroup).toEqual({ id: 'cg-7b', name: '7°B', rate: 37 / 42 });
    });

    it('names no lowest group when only one group has records', async () => {
      const { service } = build({
        sessions: [{ id: 'a', classGroup: { id: 'cg-7a', name: '7°A' } }],
        records: [{ attendanceSessionId: 'a', status: AttendanceStatus.PRESENT, _count: { _all: 10 } }],
      });

      const summary = await service.summary(user, SCHOOL);

      expect(summary.attendance).toEqual({ rate: 1, lowestGroup: null });
    });

    it('has no rate in a week without attendance', async () => {
      const { service } = build({ sessions: [] });

      expect((await service.summary(user, SCHOOL)).attendance).toEqual({ rate: null, lowestGroup: null });
    });
  });

  describe('summary — Pendientes (FR-HOM-001.8)', () => {
    it('counts submissions to review on the teacher’s assignments only', async () => {
      const { service, prisma } = build({
        toReview: [
          { assignmentId: 'as-1', _count: { _all: 18 }, _min: { submittedAt: new Date('2026-11-12T15:00:00Z') } },
          { assignmentId: 'as-2', _count: { _all: 5 }, _min: { submittedAt: new Date('2026-11-14T15:00:00Z') } },
        ],
      });

      const { toReview } = await service.summary(user, SCHOOL);

      expect(prisma.assignmentSubmission.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reviewedAt: null,
            assignment: { schoolId: SCHOOL, course: { organizationId: ORG, teacherId: TEACHER_ID } },
          },
        }),
      );
      expect(toReview).toEqual({
        submissions: 23,
        assignments: 2,
        oldestSubmittedAt: '2026-11-12T15:00:00.000Z',
        top: { assignmentId: 'as-1', title: 'Proyecto Funciones', courseName: 'Matemáticas', count: 18 },
      });
    });

    it('reports nothing to review without querying the assignment', async () => {
      const { service, prisma } = build({ toReview: [] });

      expect((await service.summary(user, SCHOOL)).toReview).toEqual({
        submissions: 0,
        assignments: 0,
        oldestSubmittedAt: null,
        top: null,
      });
      expect(prisma.assignment.findUnique).not.toHaveBeenCalled();
    });

    it('counts empty score cells and unpublished grades per course in the current period', async () => {
      const { service, prisma } = build({
        courses: [
          { id: 'c-math', _count: { students: 3 } },
          { id: 'c-alg', _count: { students: 30 } },
        ],
        grades: [
          { courseId: 'c-math', published: false, _count: { studentGrades: 1 } },
          { courseId: 'c-math', published: true, _count: { studentGrades: 0 } },
          { courseId: 'c-alg', published: true, _count: { studentGrades: 30 } },
        ],
      });

      const { grades } = await service.summary(user, SCHOOL);

      expect(prisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { periodId: 'p2', courseId: { in: ['c-math', 'c-alg'] } } }),
      );
      expect(grades).toEqual({
        periodId: 'p2',
        emptyCells: 5,
        coursesWithEmptyCells: 1,
        unpublished: 1,
        coursesWithUnpublished: 1,
        totalCourses: 2,
        topCourseId: 'c-math',
      });
    });

    it('has no grade figures or banner without any period', async () => {
      const { service, prisma } = build({ periods: [] });

      const summary = await service.summary(user, SCHOOL);

      expect(summary.grades).toBeNull();
      expect(summary.periodClose).toBeNull();
      expect(prisma.grade.findMany).not.toHaveBeenCalled();
    });

    it('shows the period-close banner when the period ends within 14 days', async () => {
      const { service } = build(); // II Trimestre ends 27 Nov; today is 16 Nov

      expect((await service.summary(user, SCHOOL)).periodClose).toEqual({
        name: 'II Trimestre',
        endDate: '2026-11-27',
        daysLeft: 11,
      });
    });
  });

  describe('periodClose (FR-HOM-001.5)', () => {
    const p = (end: string) => ({ id: 'p', name: 'II Trimestre', startDate: new Date('2026-09-01'), endDate: new Date(`${end}T05:00:00Z`) });

    it.each([
      ['2026-11-16', 0],
      ['2026-11-30', 14],
    ])('shows on %s (%i days left)', (end, days) => {
      expect(periodClose(p(end), '2026-11-16')?.daysLeft).toBe(days);
    });

    it.each(['2026-12-01', '2026-11-15'])('hides when the period ends %s', (end) => {
      expect(periodClose(p(end), '2026-11-16')).toBeNull();
    });
  });

  describe('week (FR-HOM-001.9)', () => {
    const date = (assignmentId: string, groupId: string, requireSubmission = true, courseId = 'c-math') => ({
      date: new Date('2026-11-17T23:59:00Z'),
      classGroup: { id: groupId, name: groupId },
      assignment: {
        id: assignmentId,
        title: assignmentId,
        type: AssignmentType.PROJECT,
        requireSubmission,
        course: { id: courseId, name: 'Matemáticas' },
      },
    });

    it('lists this week’s dates of the teacher’s courses with progress per group', async () => {
      const { service, prisma } = build({
        assignmentDates: [date('as-1', 'cg-7a'), date('as-1', 'cg-7b'), date('as-2', 'cg-7a', false)],
        students: [
          { id: 'st-1', classGroupId: 'cg-7a', courses: [{ id: 'c-math' }] },
          { id: 'st-2', classGroupId: 'cg-7a', courses: [{ id: 'c-math' }] },
          { id: 'st-3', classGroupId: 'cg-7a', courses: [] }, // not enrolled in the course
          { id: 'st-4', classGroupId: 'cg-7b', courses: [{ id: 'c-math' }] },
        ],
        submissions: [
          { assignmentId: 'as-1', studentId: 'st-1' },
          { assignmentId: 'as-1', studentId: 'st-4' },
        ],
      });

      const week = await service.week(user, SCHOOL);

      expect(prisma.assignmentDate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            // Monday 16 Nov 00:00 → Monday 23 Nov 00:00 in Panama (UTC−5)
            date: { gte: new Date('2026-11-16T05:00:00Z'), lt: new Date('2026-11-23T05:00:00Z') },
            assignment: { schoolId: SCHOOL, course: { organizationId: ORG, teacherId: TEACHER_ID } },
            classGroup: { organizationId: ORG, ...RELATED },
          },
        }),
      );
      expect(prisma.assignmentSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { assignmentId: { in: ['as-1'] } } }),
      );
      expect(week.items.map((i) => [i.assignmentId, i.classGroup.id, i.submitted, i.expected])).toEqual([
        ['as-1', 'cg-7a', 1, 2],
        ['as-1', 'cg-7b', 1, 1],
        ['as-2', 'cg-7a', 0, 2],
      ]);
      expect(week).toMatchObject({ timezone: 'America/Panama', weekStart: '2026-11-16', weekEnd: '2026-11-22' });
    });

    it('skips the student and submission queries for an empty week', async () => {
      const { service, prisma } = build({ assignmentDates: [] });

      expect((await service.week(user, SCHOOL)).items).toEqual([]);
      expect(prisma.student.findMany).not.toHaveBeenCalled();
      expect(prisma.assignmentSubmission.findMany).not.toHaveBeenCalled();
    });

    it('refuses a user with no teacher record', async () => {
      const { service } = build({ teacher: null });

      await expect(service.week(user, SCHOOL)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('slotState (BR-HOM-001.15)', () => {
    const s = { startTime: '08:00', endTime: '08:45', recess: false };

    it.each([
      ['07:59', false, 'LATER'],
      ['08:00', false, 'NOW'],
      ['08:44', true, 'NOW'],
      ['08:45', false, 'MISSED'],
      ['08:45', true, 'DONE'],
      ['07:00', true, 'DONE'],
    ])('at %s with attendance=%s is %s', (now, has, expected) => {
      expect(slotState(s, now, has)).toBe(expected);
    });

    it('never marks a recess as missed', () => {
      expect(slotState({ ...s, recess: true }, '09:00', false)).toBe('PAST');
    });
  });
});
