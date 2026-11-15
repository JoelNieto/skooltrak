import { AuthUserContext } from '@/auth';
import { AttendanceStatus, EnrollmentStatus, ThreadStatus } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { teacherClassGroupWhere, teacherCourseWhere } from '../teachers/teacher-scope';
import {
  AttentionReason,
  AttentionStudent,
  FamilyThread,
  TeacherAttention,
  TeacherAverage,
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
import { averageKey, GradeThresholds, round1, toThresholds, weightedAverages } from './home-grades';
import { PeriodRef, resolveCurrentPeriod, resolvePeriodPair, toHomePeriod } from './home-period';
import { timeState } from './home-schedule';
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

/** BR-HOM-001.11 (teacher view), fixed in v1 (Q5). */
export const ATTENTION = { absences: 3, late: 3, drop: 0.5, listed: 5 } as const;
/** BR-HOM-001.13 */
export const STALE_THREAD_MS = 48 * 3_600_000;
const PREVIEW_LENGTH = 140;

interface TeacherCourseScale {
  id: string;
  name: string;
  thresholds: GradeThresholds | null;
}

/** Published-score averages of the teacher's courses for the current and previous period. */
interface GradeInsights {
  current: PeriodRef | null;
  previous: PeriodRef | null;
  courses: TeacherCourseScale[];
  averages: Map<string, number>;
  /** Students with at least one current-period average, by id. */
  studentIds: Set<string>;
}

interface TeacherContext {
  organizationId: string;
  userId: string;
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
    const [attendance, toReview, grades, insights, threads] = await Promise.all([
      this.weekAttendance(ctx),
      this.toReview(ctx),
      period ? this.gradeCompleteness(ctx, period.id) : Promise.resolve(null),
      this.gradeInsights(ctx),
      this.unansweredThreads(ctx),
    ]);

    return {
      weekStart: ctx.local.weekStart,
      weekEnd: ctx.local.weekEnd,
      attendance,
      toReview,
      grades,
      periodClose: periodClose(period, ctx.local.date),
      average: insights.current ? averageTile(insights) : null,
      familyMessages: { unanswered: threads.length, stale: threads.filter((t) => t.stale).length },
    };
  }

  /** FR-HOM-001.10 students needing attention and FR-HOM-001.11 unanswered family threads. */
  async attention(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<TeacherAttention> {
    const ctx = await this.context(user, schoolId);
    const [insights, absences, threads] = await Promise.all([
      this.gradeInsights(ctx),
      this.weekAbsenceCounts(ctx),
      this.unansweredThreads(ctx),
    ]);

    const reasonsByStudent = new Map<string, { reasons: AttentionReason[]; worst: number | null }>();
    const add = (studentId: string, reason: AttentionReason) => {
      const entry = reasonsByStudent.get(studentId) ?? { reasons: [], worst: null };
      entry.reasons.push(reason);
      reasonsByStudent.set(studentId, entry);
    };

    if (insights.current) {
      for (const studentId of insights.studentIds) {
        for (const course of insights.courses) {
          const now = insights.averages.get(averageKey(studentId, course.id, insights.current.id));
          if (now === undefined) continue;
          const ref = { id: course.id, name: course.name };
          if (course.thresholds && now < course.thresholds.minimumApproval) {
            add(studentId, { kind: 'BELOW_PASS', course: ref, value: round1(now) });
          }
          const before = insights.previous
            ? insights.averages.get(averageKey(studentId, course.id, insights.previous.id))
            : undefined;
          if (before !== undefined && before - now >= ATTENTION.drop) {
            add(studentId, { kind: 'DROP', course: ref, value: round1(before - now) });
          }
        }
      }
    }
    for (const [studentId, counts] of absences) {
      if (counts.absent >= ATTENTION.absences) add(studentId, { kind: 'ABSENCES', course: null, value: counts.absent });
      if (counts.late >= ATTENTION.late) add(studentId, { kind: 'LATE', course: null, value: counts.late });
    }

    // Worst current average, for ranking and display.
    for (const [studentId, entry] of reasonsByStudent) {
      const current = insights.current;
      const avgs = current
        ? insights.courses
            .map((c) => insights.averages.get(averageKey(studentId, c.id, current.id)))
            .filter((v): v is number => v !== undefined)
        : [];
      entry.worst = avgs.length ? round1(Math.min(...avgs)) : null;
    }

    const ids = [...reasonsByStudent.keys()];
    const people = ids.length
      ? await this.prisma.student.findMany({
          where: { id: { in: ids }, organizationId: ctx.organizationId },
          select: { id: true, firstName: true, fatherName: true, classGroup: { select: { id: true, name: true } } },
        })
      : [];

    const students: AttentionStudent[] = people
      .map((p) => {
        const entry = reasonsByStudent.get(p.id) ?? { reasons: [], worst: null };
        return {
          id: p.id,
          name: `${p.firstName} ${p.fatherName}`.trim(),
          classGroup: p.classGroup,
          worstAverage: entry.worst,
          reasons: entry.reasons,
        };
      })
      .sort(
        (a, b) =>
          b.reasons.length - a.reasons.length ||
          (a.worstAverage ?? Infinity) - (b.worstAverage ?? Infinity) ||
          a.name.localeCompare(b.name),
      );

    return { students: students.slice(0, ATTENTION.listed), totalStudents: students.length, threads: threads.slice(0, 5) };
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

  /**
   * Averages of active students of the teacher's related groups in the teacher's courses, for the
   * current and previous period: one query over published, scored grades (BR-HOM-001.2).
   */
  private async gradeInsights({ organizationId, school, teacher, local }: TeacherContext): Promise<GradeInsights> {
    const [{ current, previous }, rawCourses] = await Promise.all([
      resolvePeriodPair(this.prisma, school.currentYear, local.date),
      this.prisma.course.findMany({
        where: { organizationId, schoolId: school.id, ...teacherCourseWhere(teacher.id) },
        select: {
          id: true,
          name: true,
          studyPlan: { select: { gradeMetric: { select: { maximum: true, minimumApproval: true, minimumExcellence: true } } } },
        },
      }),
    ]);
    const courses = rawCourses.map((c) => ({ id: c.id, name: c.name, thresholds: toThresholds(c.studyPlan?.gradeMetric) }));
    const periodIds = [current?.id, previous?.id].filter((id): id is string => Boolean(id));
    if (!current || !courses.length) {
      return { current, previous, courses, averages: new Map(), studentIds: new Set() };
    }

    const courseIds = courses.map((c) => c.id);
    const rows = await this.prisma.studentGrade.findMany({
      where: {
        score: { not: null },
        grade: { published: true, periodId: { in: periodIds }, courseId: { in: courseIds } },
        student: {
          organizationId,
          enrollmentStatus: ACTIVE,
          classGroup: teacherClassGroupWhere(teacher.id),
          courses: { some: { id: { in: courseIds } } },
        },
      },
      select: {
        studentId: true,
        score: true,
        grade: { select: { courseId: true, periodId: true, bucket: { select: { weight: true } } } },
      },
    });

    const averages = weightedAverages(rows);
    const studentIds = new Set(rows.filter((r) => r.grade.periodId === current.id).map((r) => r.studentId));
    return { current, previous, courses, averages, studentIds };
  }

  /** ABSENT and LATE records per student this week in the teacher's classes. */
  private async weekAbsenceCounts({ organizationId, school, teacher, local }: TeacherContext) {
    const rows = await this.prisma.attendanceRecord.groupBy({
      by: ['studentId', 'status'],
      where: {
        status: { in: [AttendanceStatus.ABSENT, AttendanceStatus.LATE] },
        student: { enrollmentStatus: ACTIVE },
        attendanceSession: {
          organizationId,
          date: { gte: utcDate(local.weekStart), lte: utcDate(local.weekEnd) },
          course: { schoolId: school.id, ...teacherCourseWhere(teacher.id) },
          classGroup: teacherClassGroupWhere(teacher.id),
        },
      },
      _count: { _all: true },
    });
    const byStudent = new Map<string, { absent: number; late: number }>();
    for (const row of rows) {
      const counts = byStudent.get(row.studentId) ?? { absent: 0, late: 0 };
      if (row.status === AttendanceStatus.ABSENT) counts.absent += row._count._all;
      else counts.late += row._count._all;
      byStudent.set(row.studentId, counts);
    }
    return byStudent;
  }

  /** BR-HOM-001.13: the teacher's active non-broadcast threads whose last message is from a parent, newest first. */
  private async unansweredThreads({ organizationId, userId }: TeacherContext): Promise<FamilyThread[]> {
    const threads = await this.prisma.communicationThread.findMany({
      where: {
        organizationId,
        broadcast: false,
        deletedAt: null,
        status: ThreadStatus.ACTIVE,
        participants: { some: { userId } },
      },
      select: {
        id: true,
        title: true,
        participants: { where: { userId }, select: { lastReadAt: true } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            body: true,
            createdAt: true,
            sender: { select: { name: true, firstName: true, lastName: true, role: { select: { name: true } } } },
          },
        },
      },
    });

    const now = this.clock.now().getTime();
    return threads
      .filter((t) => t.messages[0]?.sender?.role?.name?.toUpperCase() === 'PARENT')
      .map((t) => {
        const last = t.messages[0];
        const lastReadAt = t.participants[0]?.lastReadAt;
        const sender = last.sender;
        return {
          id: t.id,
          title: t.title,
          senderName: (sender?.name?.trim() || [sender?.firstName, sender?.lastName].filter(Boolean).join(' ')).trim() || '—',
          lastMessageAt: last.createdAt.toISOString(),
          preview: last.body.length > PREVIEW_LENGTH ? `${last.body.slice(0, PREVIEW_LENGTH - 1)}…` : last.body,
          unread: !lastReadAt || last.createdAt > lastReadAt,
          stale: now - last.createdAt.getTime() > STALE_THREAD_MS,
        };
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
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

    return {
      organizationId,
      userId: user.userId,
      school,
      teacher,
      local: schoolLocalTime(this.clock.now(), school.timezone),
    };
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
  const time = timeState(slot, now);
  if (time === 'NOW') return 'NOW';
  if (slot.recess) return time;
  if (hasAttendance) return 'DONE';
  return time === 'PAST' ? 'MISSED' : 'LATER';
}

/** FR-HOM-001.5: only while the period is still running and ends within the window. */
export function periodClose(period: PeriodRef | null, today: string): TeacherPeriodClose | null {
  if (!period) return null;
  const endDate = period.endDate.toISOString().slice(0, 10);
  const daysLeft = daysBetween(today, endDate);
  return daysLeft >= 0 && daysLeft <= PERIOD_CLOSE_WINDOW_DAYS ? { name: period.name, endDate, daysLeft } : null;
}

/** FR-HOM-001.7 average tile (BR-HOM-001.1): no value when the courses use different scales. */
export function averageTile(insights: GradeInsights): TeacherAverage {
  const current = insights.current;
  const coursesWithoutScale = insights.courses.filter((c) => !c.thresholds).length;
  if (!current) return { value: null, max: null, studentsBelowPass: null, coursesWithoutScale };

  const values: number[] = [];
  const maxima = new Set<number>();
  const below = new Set<string>();
  for (const course of insights.courses) {
    for (const studentId of insights.studentIds) {
      const avg = insights.averages.get(averageKey(studentId, course.id, current.id));
      if (avg === undefined) continue;
      values.push(avg);
      maxima.add(course.thresholds?.maximum ?? Number.NaN);
      if (course.thresholds && avg < course.thresholds.minimumApproval) below.add(studentId);
    }
  }
  const sameScale = maxima.size === 1 && !maxima.has(Number.NaN);
  const max = sameScale ? [...maxima][0] : null;
  return {
    value: values.length && sameScale ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null,
    max,
    studentsBelowPass: coursesWithoutScale === insights.courses.length ? null : below.size,
    coursesWithoutScale,
  };
}

function sumValues(m: Map<string, number>) {
  return [...m.values()].reduce((sum, n) => sum + n, 0);
}


function sumCounts(counts: AttendanceStatusCounts) {
  return Object.values(counts).reduce<number>((sum, n) => sum + (n ?? 0), 0);
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}
