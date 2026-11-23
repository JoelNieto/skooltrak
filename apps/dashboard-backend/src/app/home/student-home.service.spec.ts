import { ForbiddenException } from '@nestjs/common';
import { AssignmentType, AttendanceStatus, HabitValue, WeekDay } from '@generated/prisma';
import { unreadChannelPostCount } from '../communication/channel-audience';
import { habitsSummary, StudentHomeService, workStatus } from './student-home.service';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../communication/channel-audience', () => ({ unreadChannelPostCount: jest.fn() }));

/** HOM-001-S04: student "Ahora / Siguiente", today's classes and work (BR-HOM-001.8, .12). */
describe('StudentHomeService (HOM-001-S04)', () => {
  const ORG = 'org-1';
  const user = { userId: 'user-student', organizationId: ORG, role: 'STUDENT' };
  // Monday 16 Nov 2026, 09:15 in Panama.
  const NOW = new Date('2026-11-16T14:15:00Z');
  const GROUP = { id: 'cg-9a', name: '9°A' };

  const slot = (id: string, startTime: string, endTime: string, extra: Record<string, unknown> = {}) => ({
    id,
    startTime,
    endTime,
    location: 'Aula 12',
    remote: false,
    remoteLink: '',
    recess: false,
    course: { id: `c-${id}`, name: `Curso ${id}`, teacher: { firstName: 'Carlos', fatherName: 'Méndez' } },
    ...extra,
  });

  function build(
    opts: {
      student?: unknown;
      slots?: unknown[];
      dates?: unknown[];
      periods?: unknown[];
      courses?: unknown[];
      metric?: unknown;
      scores?: unknown[];
      recent?: unknown[];
      attendance?: unknown[];
      unreadPosts?: number;
      habits?: unknown[];
    } = {},
  ) {
    const prisma = {
      student: {
        findFirst: jest.fn().mockResolvedValue(
          opts.student === undefined
            ? {
                id: 'st-1',
                firstName: 'Sofía',
                classGroup: GROUP,
                school: { id: 'school-1', currentYear: 2026, timezone: 'America/Panama' },
              }
            : opts.student,
        ),
      },
      period: { findMany: jest.fn().mockResolvedValue(opts.periods ?? []) },
      classGroupWeeklySchedule: { findMany: jest.fn().mockResolvedValue(opts.slots ?? []) },
      assignmentDate: { findMany: jest.fn().mockResolvedValue(opts.dates ?? []) },
      course: { findMany: jest.fn().mockResolvedValue(opts.courses ?? []) },
      classGroup: {
        findUnique: jest.fn().mockResolvedValue(opts.metric === undefined ? null : { studyPlan: { gradeMetric: opts.metric } }),
      },
      studentGrade: {
        // progress() asks once for averages and once (with `take`) for the recent grades.
        findMany: jest.fn().mockImplementation(({ take }) => Promise.resolve(take ? (opts.recent ?? []) : (opts.scores ?? []))),
      },
      attendanceRecord: { groupBy: jest.fn().mockResolvedValue(opts.attendance ?? []) },
      studentHabitEvaluation: { findMany: jest.fn().mockResolvedValue(opts.habits ?? []) },
    };
    (unreadChannelPostCount as jest.Mock).mockReset().mockResolvedValue(opts.unreadPosts ?? 0);
    return { service: new StudentHomeService(prisma as never, { now: () => NOW }), prisma };
  }

  describe('today (FR-HOM-001.12)', () => {
    it("shows today's classes of the student's own group with the current and next class", async () => {
      const { service, prisma } = build({
        slots: [
          slot('a', '07:00', '07:45'),
          slot('b', '08:45', '09:00', { recess: true }),
          slot('c', '09:00', '10:30'),
          slot('d', '10:30', '11:15', { remote: true, remoteLink: 'https://meet.test/x', course: { id: 'c-d', name: 'Arte', teacher: null } }),
        ],
      });

      const today = await service.today(user);

      expect(prisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-student', organizationId: ORG } }),
      );
      expect(prisma.classGroupWeeklySchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { classGroupId: 'cg-9a', weekday: WeekDay.MONDAY, classGroup: { organizationId: ORG } },
        }),
      );
      expect(today.slots.map((s) => [s.id, s.state])).toEqual([
        ['a', 'PAST'],
        ['b', 'PAST'],
        ['c', 'NOW'],
        ['d', 'LATER'],
      ]);
      expect(today.now?.id).toBe('c');
      expect(today.now?.teacherName).toBe('Carlos Méndez');
      expect(today.next).toMatchObject({ id: 'd', teacherName: null, course: { id: 'c-d', name: 'Arte' } });
      expect(today).toMatchObject({ firstName: 'Sofía', date: '2026-11-16', time: '09:15', classGroup: GROUP });
    });

    it('has no schedule without a class group', async () => {
      const { service, prisma } = build({
        student: {
          id: 'st-1',
          firstName: 'Sofía',
          classGroup: null,
          school: { id: 'school-1', currentYear: 2026, timezone: 'America/Panama' },
        },
      });

      const today = await service.today(user);

      expect(today).toMatchObject({ classGroup: null, slots: [], now: null, next: null });
      expect(prisma.classGroupWeeklySchedule.findMany).not.toHaveBeenCalled();
    });

    it('refuses a user without a student record in the organization', async () => {
      const { service } = build({ student: null });

      await expect(service.today(user)).rejects.toThrow(
        new ForbiddenException('No student profile in this organization'),
      );
      await expect(service.today({ ...user, organizationId: null })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('work (FR-HOM-001.14)', () => {
    const due = (id: string, date: string, requireSubmission = true, submittedAt?: string) => ({
      date: new Date(date),
      assignment: {
        id,
        title: id,
        type: requireSubmission ? AssignmentType.HOMEWORK : AssignmentType.EXAM,
        requireSubmission,
        course: { id: 'c-1', name: 'Matemáticas' },
        submissions: submittedAt ? [{ submittedAt: new Date(submittedAt) }] : [],
      },
    });

    it("lists the group's work from today on and overdue work, overdue first", async () => {
      const { service, prisma } = build({
        dates: [
          due('overdue', '2026-11-14T22:00:00Z'),
          due('handed-in-past', '2026-11-13T22:00:00Z', true, '2026-11-13T20:00:00Z'),
          due('handed-in-today', '2026-11-16T13:00:00Z', true, '2026-11-15T20:00:00Z'),
          due('exam', '2026-11-17T14:00:00Z', false),
          due('pending', '2026-11-19T04:59:00Z'),
        ],
      });

      const work = await service.work(user);

      expect(prisma.assignmentDate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            classGroupId: 'cg-9a',
            // 9 Nov 00:00 → 1 Dec 00:00, Panama time
            date: { gte: new Date('2026-11-09T05:00:00Z'), lt: new Date('2026-12-01T05:00:00Z') },
            assignment: { course: { organizationId: ORG } },
          },
        }),
      );
      expect(work.items.map((i) => [i.assignmentId, i.status])).toEqual([
        ['overdue', 'VENCIDA'],
        ['handed-in-today', 'ENTREGADO'],
        ['exam', 'PRESENCIAL'],
        ['pending', 'PENDIENTE'],
      ]);
      expect(work.items[1].submittedAt).toBe('2026-11-15T20:00:00.000Z');
    });

    it('has no work without a class group', async () => {
      const { service, prisma } = build({
        student: { id: 'st-1', firstName: 'Sofía', classGroup: null, school: { id: 's', currentYear: 2026, timezone: 'UTC' } },
      });

      expect((await service.work(user)).items).toEqual([]);
      expect(prisma.assignmentDate.findMany).not.toHaveBeenCalled();
    });
  });

  describe('progress (FR-HOM-001.13, .16, .17)', () => {
    const PERIODS = [
      { id: 'p1', name: 'I Trimestre', startDate: new Date('2026-06-01T05:00:00Z'), endDate: new Date('2026-08-28T05:00:00Z') },
      { id: 'p2', name: 'II Trimestre', startDate: new Date('2026-09-01T05:00:00Z'), endDate: new Date('2026-11-27T05:00:00Z') },
    ];
    const METRIC = { maximum: 5, minimumApproval: 3, minimumExcellence: 4.5 };
    const score = (courseId: string, periodId: string, value: number, weight = 1) => ({
      studentId: 'st-1',
      score: value,
      grade: { courseId, periodId, bucketId: `b-${weight}`, bucket: { weight } },
    });
    const COURSES = [
      { id: 'c-math', name: 'Matemáticas' },
      { id: 'c-sci', name: 'Ciencias' },
      { id: 'c-art', name: 'Arte' },
    ];

    it('averages each course on the study plan scale, with the period average and its change', async () => {
      const { service, prisma } = build({
        periods: PERIODS,
        courses: COURSES,
        metric: METRIC,
        scores: [
          score('c-math', 'p2', 4.6),
          score('c-sci', 'p2', 2),
          score('c-sci', 'p2', 3.6, 3), // (2 + 10.8) / 4 = 3.2
          score('c-math', 'p1', 4),
          score('c-sci', 'p1', 3),
        ],
      });

      const progress = await service.progress(user);

      expect(prisma.studentGrade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: 'st-1',
            score: { not: null },
            grade: { published: true, periodId: { in: ['p2', 'p1'] }, course: { organizationId: ORG } },
          },
        }),
      );
      expect(progress.courses).toEqual([
        { id: 'c-math', name: 'Matemáticas', average: 4.6, band: 'EXCELLENT' },
        { id: 'c-sci', name: 'Ciencias', average: 3.2, band: 'PASSING' },
        { id: 'c-art', name: 'Arte', average: null, band: null },
      ]);
      expect(progress.average).toEqual({ value: 3.9, previous: 3.5, delta: 0.4 });
      expect(progress.scale).toEqual(METRIC);
      expect(progress.period).toEqual({ id: 'p2', name: 'II Trimestre' });
    });

    it('has no bands without a grade metric', async () => {
      const { service } = build({ periods: PERIODS, courses: COURSES.slice(0, 1), scores: [score('c-math', 'p2', 1)] });

      const progress = await service.progress(user);

      expect(progress.scale).toBeNull();
      expect(progress.courses[0]).toEqual({ id: 'c-math', name: 'Matemáticas', average: 1, band: null });
    });

    it('returns the latest published grades with their band', async () => {
      const { service, prisma } = build({
        periods: PERIODS,
        metric: METRIC,
        recent: [
          { id: 'sg-1', score: { toNumber: () => 2.8 }, grade: { title: 'Prueba', date: new Date('2026-11-12T15:00:00Z'), course: { id: 'c-sci', name: 'Ciencias' } } },
        ],
      });

      const { recentGrades } = await service.progress(user);

      expect(prisma.studentGrade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { grade: { date: 'desc' } }, take: 3 }),
      );
      expect(recentGrades).toEqual([
        { id: 'sg-1', title: 'Prueba', course: { id: 'c-sci', name: 'Ciencias' }, score: 2.8, band: 'BELOW', date: '2026-11-12T15:00:00.000Z' },
      ]);
    });

    it('rates attendance from the period start to today and counts unread channel posts', async () => {
      const { service, prisma } = build({
        periods: PERIODS,
        attendance: [
          { status: AttendanceStatus.PRESENT, _count: { _all: 46 } },
          { status: AttendanceStatus.LATE, _count: { _all: 1 } },
          { status: AttendanceStatus.ABSENT, _count: { _all: 2 } },
          { status: AttendanceStatus.EXCUSED, _count: { _all: 1 } },
        ],
        unreadPosts: 3,
      });

      const progress = await service.progress(user);

      expect(prisma.attendanceRecord.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: 'st-1',
            attendanceSession: {
              organizationId: ORG,
              date: { gte: new Date('2026-09-01T00:00:00Z'), lte: new Date('2026-11-16T00:00:00Z') },
            },
          },
        }),
      );
      expect(progress.attendance).toEqual({ rate: 47 / 49, absences: 2, late: 1 });
      expect(progress.messages).toEqual({ unread: 3 });
      expect(unreadChannelPostCount).toHaveBeenCalledWith(prisma, 'user-student');
    });

    it('summarises published habits of the current period', async () => {
      const mark = (name: string, order: number, value: HabitValue) => ({ value, habitEvaluation: { habitMetric: { name, order } } });
      const { service, prisma } = build({
        periods: PERIODS,
        habits: [mark('Responsabilidad', 1, HabitValue.S), mark('Puntualidad', 3, HabitValue.R), mark('Orden', 2, HabitValue.X)],
      });

      const { habits } = await service.progress(user);

      expect(prisma.studentHabitEvaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 'st-1', habitEvaluation: { classGroupId: 'cg-9a', periodId: 'p2', published: true } },
        }),
      );
      expect(habits).toEqual({
        total: 3,
        satisfactory: 1,
        flagged: [
          { name: 'Orden', value: 'X' },
          { name: 'Puntualidad', value: 'R' },
        ],
      });
      expect(habitsSummary([])).toEqual({ total: 0, satisfactory: 0, flagged: [] });
    });

    it('has no period figures without a period', async () => {
      const { service, prisma } = build({ periods: [] });

      const progress = await service.progress(user);

      expect(progress).toMatchObject({ period: null, attendance: null, habits: null, average: { value: null, previous: null, delta: null } });
      expect(prisma.attendanceRecord.groupBy).not.toHaveBeenCalled();
    });

    it('refuses a user without a student record', async () => {
      const { service } = build({ student: null });

      await expect(service.progress(user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('workStatus (BR-HOM-001.12)', () => {
    const past = new Date('2026-11-15T00:00:00Z');
    const future = new Date('2026-11-17T00:00:00Z');

    it.each([
      [past, true, true, 'ENTREGADO'],
      [future, true, true, 'ENTREGADO'],
      [past, false, false, 'PRESENCIAL'],
      [past, true, false, 'VENCIDA'],
      [future, true, false, 'PENDIENTE'],
    ] as const)('due %s, requireSubmission=%s, submitted=%s → %s', (dueAt, requireSubmission, submitted, expected) => {
      expect(workStatus({ dueAt, requireSubmission, submitted }, NOW)).toBe(expected);
    });

    it('puts a published linked grade first: CALIFICADA or EXENTA (BR-ACA-001.6, FR-ACA-001.17)', () => {
      expect(workStatus({ dueAt: past, requireSubmission: true, submitted: true, graded: { score: 4.5, excused: false } }, NOW)).toBe(
        'CALIFICADA',
      );
      expect(workStatus({ dueAt: past, requireSubmission: true, submitted: false, graded: { score: null, excused: true } }, NOW)).toBe(
        'EXENTA',
      );
      expect(workStatus({ dueAt: future, requireSubmission: false, submitted: false, graded: { score: 3, excused: false } }, NOW)).toBe(
        'CALIFICADA',
      );
    });

    it('falls through to the usual rules when the linked cell is empty', () => {
      expect(workStatus({ dueAt: past, requireSubmission: true, submitted: false, graded: { score: null, excused: false } }, NOW)).toBe(
        'VENCIDA',
      );
    });
  });
});
