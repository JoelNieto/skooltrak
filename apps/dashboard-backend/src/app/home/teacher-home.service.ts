import { AuthUserContext } from '@/auth';
import { AttendanceStatus, EnrollmentStatus } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { teacherClassGroupWhere, teacherCourseWhere } from '../teachers/teacher-scope';
import {
  HomePeriod,
  TeacherGrades,
  TeacherGroupRate,
  TeacherPeriodClose,
  TeacherSlot,
  TeacherSlotState,
  TeacherSummary,
  TeacherToday,
  TeacherToReview,
  TeacherWeek,
  TeacherWeekItem,
} from './entities/teacher-home.entity';
import { addCount, attendanceRate, AttendanceStatusCounts } from './home-attendance';
import { PeriodRef, resolveCurrentPeriod } from './home-period';
import {
  addDays,
  CLOCK,
  Clock,
  daysBetween,
  localMidnight,
  SchoolLocalTime,
  schoolLocalTime,
  utcDate,
} from './home-time';

/** FR-HOM-001.5: the period-close banner shows from this many days before the period ends. */
export const PERIOD_CLOSE_WINDOW_DAYS = 14;

const ACTIVE = EnrollmentStatus.ACTIVE;

interface TeacherContext {
  organizationId: string;
  school: { id: string; currentYear: number; timezone: string };
  teacher: { id: string; firstName: string };
  local: SchoolLocalTime;
}

/** Teacher home read models (HOM-001, teacher sections). Scope: BR-HOM-001.7. */
@Injectable()
export class TeacherHomeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** FR-HOM-001.6: today's slots for the teacher's courses, with attendance state. */
  async today(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<TeacherToday> {
    const { organizationId, school, teacher, local } = await this.context(user, schoolId);

    const [period, rows] = await Promise.all([
      resolveCurrentPeriod(this.prisma, school.currentYear, local.date),
      this.prisma.classGroupWeeklySchedule.findMany({
        where: {
          weekday: local.weekday,
          course: { organizationId, schoolId: school.id, ...teacherCourseWhere(teacher.id) },
          classGroup: { organizationId, active: true, ...teacherClassGroupWhere(teacher.id) },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          location: true,
          remote: true,
          remoteLink: true,
          recess: true,
          course: { select: { id: true, name: true } },
          classGroup: { select: { id: true, name: true } },
        },
        orderBy: [{ startTime: 'asc' }, { endTime: 'asc' }],
      }),
    ]);

    const sessions = rows.length
      ? await this.prisma.attendanceSession.findMany({
          where: {
            organizationId,
            date: utcDate(local.date),
            courseId: { in: unique(rows.map((r) => r.course.id)) },
            classGroupId: { in: unique(rows.map((r) => r.classGroup.id)) },
          },
          select: { id: true, courseId: true, classGroupId: true },
        })
      : [];
    const countsBySession = await this.recordCountsBySession(sessions.map((s) => s.id));
    const sessionByKey = new Map(sessions.map((s) => [`${s.courseId}|${s.classGroupId}`, s.id]));

    const slots: TeacherSlot[] = rows.map((row) => {
      const sessionId = row.recess ? undefined : sessionByKey.get(`${row.course.id}|${row.classGroup.id}`);
      const counts = sessionId ? countsBySession.get(sessionId) ?? {} : undefined;
      return {
        ...row,
        state: slotState(row, local.time, Boolean(sessionId)),
        attendance:
          sessionId && counts
            ? {
                sessionId,
                presentOrLate: (counts[AttendanceStatus.PRESENT] ?? 0) + (counts[AttendanceStatus.LATE] ?? 0),
                total: sumCounts(counts),
              }
            : null,
      };
    });

    return {
      firstName: teacher.firstName,
      timezone: local.timezone,
      date: local.date,
      time: local.time,
      period: toHomePeriod(period),
      slots,
      pendingAttendance: slots.filter((s) => !s.recess && !s.attendance && (s.state === 'NOW' || s.state === 'MISSED'))
        .length,
    };
  }

  /**
   * FR-HOM-001.7 KPIs and FR-HOM-001.8 Pendientes: attendance this week, submissions to review,
   * grade completeness of the current period and the period-close banner (FR-HOM-001.5).
   */
  async summary(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<TeacherSummary> {
    const ctx = await this.context(user, schoolId);
    const period = await resolveCurrentPeriod(this.prisma, ctx.school.currentYear, ctx.local.date);
    const [attendance, toReview, grades] = await Promise.all([
      this.weekAttendance(ctx),
      this.toReview(ctx),
      period ? this.gradeCompleteness(ctx, period.id) : Promise.resolve(null),
    ]);

    return {
      weekStart: ctx.local.weekStart,
      weekEnd: ctx.local.weekEnd,
      attendance,
      toReview,
      grades,
      periodClose: periodClose(period, ctx.local.date),
    };
  }

  /** FR-HOM-001.9: this week's assignment dates of the teacher's courses, with hand-in progress. */
  async week(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<TeacherWeek> {
    const { organizationId, school, teacher, local } = await this.context(user, schoolId);

    const dates = await this.prisma.assignmentDate.findMany({
      where: {
        date: { gte: localMidnight(local.weekStart, local.timezone), lt: localMidnight(addDays(local.weekEnd, 1), local.timezone) },
        assignment: { schoolId: school.id, course: { organizationId, ...teacherCourseWhere(teacher.id) } },
        classGroup: { organizationId, ...teacherClassGroupWhere(teacher.id) },
      },
      select: {
        date: true,
        classGroup: { select: { id: true, name: true } },
        assignment: {
          select: { id: true, title: true, type: true, requireSubmission: true, course: { select: { id: true, name: true } } },
        },
      },
      orderBy: { date: 'asc' },
    });

    const courseIds = unique(dates.map((d) => d.assignment.course.id));
    const groupIds = unique(dates.map((d) => d.classGroup.id));
    const assignmentIds = unique(dates.filter((d) => d.assignment.requireSubmission).map((d) => d.assignment.id));

    const [students, submissions] = dates.length
      ? await Promise.all([
          this.prisma.student.findMany({
            where: { organizationId, enrollmentStatus: ACTIVE, classGroupId: { in: groupIds }, courses: { some: { id: { in: courseIds } } } },
            select: { id: true, classGroupId: true, courses: { where: { id: { in: courseIds } }, select: { id: true } } },
          }),
          assignmentIds.length
            ? this.prisma.assignmentSubmission.findMany({
                where: { assignmentId: { in: assignmentIds } },
                select: { assignmentId: true, studentId: true },
              })
            : Promise.resolve([]),
        ])
      : [[], []];

    const submittedBy = new Map<string, Set<string>>();
    for (const s of submissions) {
      const set = submittedBy.get(s.assignmentId) ?? new Set<string>();
      set.add(s.studentId);
      submittedBy.set(s.assignmentId, set);
    }

    const items: TeacherWeekItem[] = dates.map((d) => {
      const enrolled = students.filter(
        (st) => st.classGroupId === d.classGroup.id && st.courses.some((c) => c.id === d.assignment.course.id),
      );
      const handedIn = submittedBy.get(d.assignment.id);
      return {
        assignmentId: d.assignment.id,
        title: d.assignment.title,
        type: d.assignment.type,
        requireSubmission: d.assignment.requireSubmission,
        course: d.assignment.course,
        classGroup: d.classGroup,
        dueAt: d.date.toISOString(),
        submitted: handedIn ? enrolled.filter((st) => handedIn.has(st.id)).length : 0,
        expected: enrolled.length,
      };
    });

    return { timezone: local.timezone, weekStart: local.weekStart, weekEnd: local.weekEnd, items };
  }

  private async weekAttendance({ organizationId, school, teacher, local }: TeacherContext) {
    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        organizationId,
        date: { gte: utcDate(local.weekStart), lte: utcDate(local.weekEnd) },
        course: { schoolId: school.id, ...teacherCourseWhere(teacher.id) },
        classGroup: teacherClassGroupWhere(teacher.id),
      },
      select: { id: true, classGroup: { select: { id: true, name: true } } },
    });
    const countsBySession = await this.recordCountsBySession(sessions.map((s) => s.id));

    const total: AttendanceStatusCounts = {};
    const byGroup = new Map<string, { name: string; counts: AttendanceStatusCounts }>();
    for (const session of sessions) {
      const counts = countsBySession.get(session.id) ?? {};
      const group = byGroup.get(session.classGroup.id) ?? { name: session.classGroup.name, counts: {} };
      for (const [status, n] of Object.entries(counts) as [AttendanceStatus, number][]) {
        addCount(total, status, n);
        addCount(group.counts, status, n);
      }
      byGroup.set(session.classGroup.id, group);
    }

    const groupRates: TeacherGroupRate[] = [...byGroup.entries()]
      .map(([id, g]) => ({ id, name: g.name, rate: attendanceRate(g.counts) }))
      .filter((g): g is TeacherGroupRate => g.rate !== null)
      .sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name));

    return {
      rate: attendanceRate(total),
      lowestGroup: groupRates.length >= 2 ? groupRates[0] : null,
    };
  }

  /** BR-HOM-001.17: submissions to the teacher's assignments not yet marked reviewed. */
  private async toReview({ organizationId, school, teacher }: TeacherContext): Promise<TeacherToReview> {
    const rows = await this.prisma.assignmentSubmission.groupBy({
      by: ['assignmentId'],
      where: {
        reviewedAt: null,
        assignment: { schoolId: school.id, course: { organizationId, ...teacherCourseWhere(teacher.id) } },
      },
      _count: { _all: true },
      _min: { submittedAt: true },
    });
    if (!rows.length) return { submissions: 0, assignments: 0, oldestSubmittedAt: null, top: null };

    const topRow = [...rows].sort((a, b) => b._count._all - a._count._all)[0];
    const topAssignment = await this.prisma.assignment.findUnique({
      where: { id: topRow.assignmentId },
      select: { id: true, title: true, course: { select: { name: true } } },
    });
    const oldest = rows
      .map((r) => r._min.submittedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      submissions: rows.reduce((sum, r) => sum + r._count._all, 0),
      assignments: rows.length,
      oldestSubmittedAt: oldest ? oldest.toISOString() : null,
      top: topAssignment
        ? { assignmentId: topAssignment.id, title: topAssignment.title, courseName: topAssignment.course.name, count: topRow._count._all }
        : null,
    };
  }

  /** Empty score cells and unpublished grades of the teacher's courses in `periodId`. */
  private async gradeCompleteness({ organizationId, school, teacher }: TeacherContext, periodId: string): Promise<TeacherGrades> {
    const courses = await this.prisma.course.findMany({
      where: { organizationId, schoolId: school.id, ...teacherCourseWhere(teacher.id) },
      select: { id: true, _count: { select: { students: { where: { enrollmentStatus: ACTIVE } } } } },
    });
    const grades = courses.length
      ? await this.prisma.grade.findMany({
          where: { periodId, courseId: { in: courses.map((c) => c.id) } },
          select: {
            courseId: true,
            published: true,
            _count: { select: { studentGrades: { where: { score: { not: null }, student: { enrollmentStatus: ACTIVE } } } } },
          },
        })
      : [];

    const enrolled = new Map(courses.map((c) => [c.id, c._count.students]));
    const emptyByCourse = new Map<string, number>();
    const unpublishedByCourse = new Map<string, number>();
    for (const g of grades) {
      const empty = Math.max(0, (enrolled.get(g.courseId) ?? 0) - g._count.studentGrades);
      if (empty) emptyByCourse.set(g.courseId, (emptyByCourse.get(g.courseId) ?? 0) + empty);
      if (!g.published) unpublishedByCourse.set(g.courseId, (unpublishedByCourse.get(g.courseId) ?? 0) + 1);
    }
    const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      periodId,
      emptyCells: sumValues(emptyByCourse),
      coursesWithEmptyCells: emptyByCourse.size,
      unpublished: sumValues(unpublishedByCourse),
      coursesWithUnpublished: unpublishedByCourse.size,
      totalCourses: courses.length,
      topCourseId: top(emptyByCourse) ?? top(unpublishedByCourse),
    };
  }

  /** BR-HOM-001.7 / .10: caller's org, a school of that org, and a teacher record in it. */
  private async context(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<TeacherContext> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const organizationId = user.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (!schoolId) throw new BadRequestException('schoolId is required');

    const [school, teacher] = await Promise.all([
      this.prisma.school.findFirst({
        where: { id: schoolId, organizationId },
        select: { id: true, currentYear: true, timezone: true },
      }),
      this.prisma.teacher.findFirst({
        where: { userId: user.userId, organizationId },
        select: { id: true, firstName: true },
      }),
    ]);
    if (!school) throw new ForbiddenException('School not in your organization');
    if (!teacher) throw new ForbiddenException('No teacher profile in this organization');

    return { organizationId, school, teacher, local: schoolLocalTime(this.clock.now(), school.timezone) };
  }

  private async recordCountsBySession(sessionIds: string[]) {
    const bySession = new Map<string, AttendanceStatusCounts>();
    if (!sessionIds.length) return bySession;
    const rows = await this.prisma.attendanceRecord.groupBy({
      by: ['attendanceSessionId', 'status'],
      where: { attendanceSessionId: { in: sessionIds } },
      _count: { _all: true },
    });
    for (const row of rows) {
      const counts = bySession.get(row.attendanceSessionId) ?? {};
      addCount(counts, row.status, row._count._all);
      bySession.set(row.attendanceSessionId, counts);
    }
    return bySession;
  }
}

/**
 * NOW while the slot runs; otherwise DONE once attendance exists, MISSED after the end without it
 * (BR-HOM-001.15), LATER before it starts. Recess never needs attendance: LATER / NOW / PAST.
 */
export function slotState(
  slot: { startTime: string; endTime: string; recess: boolean },
  now: string,
  hasAttendance: boolean,
): TeacherSlotState {
  const started = slot.startTime <= now;
  const ended = slot.endTime <= now;
  if (started && !ended) return 'NOW';
  if (slot.recess) return ended ? 'PAST' : 'LATER';
  if (hasAttendance) return 'DONE';
  return ended ? 'MISSED' : 'LATER';
}

/** FR-HOM-001.5: only while the period is still running and ends within the window. */
export function periodClose(period: PeriodRef | null, today: string): TeacherPeriodClose | null {
  if (!period) return null;
  const endDate = period.endDate.toISOString().slice(0, 10);
  const daysLeft = daysBetween(today, endDate);
  return daysLeft >= 0 && daysLeft <= PERIOD_CLOSE_WINDOW_DAYS ? { name: period.name, endDate, daysLeft } : null;
}

function sumValues(m: Map<string, number>) {
  return [...m.values()].reduce((sum, n) => sum + n, 0);
}

function toHomePeriod(period: PeriodRef | null): HomePeriod | null {
  return period ? { id: period.id, name: period.name, endDate: period.endDate.toISOString().slice(0, 10) } : null;
}

function sumCounts(counts: AttendanceStatusCounts) {
  return Object.values(counts).reduce<number>((sum, n) => sum + (n ?? 0), 0);
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}
