import { AuthUserContext } from '@/auth';
import { AttendanceStatus, HabitValue, ThreadStatus } from '@generated/prisma';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { enrolledCourses } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';
import {
  StudentHabits,
  StudentProgress,
  StudentSlot,
  StudentToday,
  StudentWork,
  StudentWorkItem,
  StudentWorkStatus,
} from './entities/student-home.entity';
import { addCount, attendanceRate, AttendanceStatusCounts } from './home-attendance';
import { averageKey, gradeBand, round1, toThresholds, weightedAverages } from './home-grades';
import { resolveCurrentPeriod, resolvePeriodPair, toHomePeriod } from './home-period';
import { timeState } from './home-schedule';
import { addDays, CLOCK, Clock, localMidnight, SchoolLocalTime, schoolLocalTime, utcDate } from './home-time';

/** FR-HOM-001.14 window. */
export const WORK_WINDOW = { aheadDays: 14, overdueDays: 7 } as const;

/** FR-HOM-001.16 */
export const RECENT_GRADES = 3;

const STUDENT_SELECT = {
  id: true,
  firstName: true,
  classGroup: { select: { id: true, name: true } },
  school: { select: { id: true, currentYear: true, timezone: true } },
} as const;

/** Whose student data is read: the caller (student home) or a linked child (parent home). */
export interface StudentContext {
  organizationId: string;
  /** The student's own user, for their message counts; null when the student has no login. */
  userId: string | null;
  student: {
    id: string;
    firstName: string;
    classGroup: { id: string; name: string } | null;
    school: { id: string; currentYear: number; timezone: string };
  };
  local: SchoolLocalTime;
}

/** Student home read models (HOM-001, student sections). Scope: the caller's own Student record (BR-HOM-001.8). */
@Injectable()
export class StudentHomeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** FR-HOM-001.12: today's classes of the student's group, with the current and next class. */
  async today(user: AuthUserContext | undefined): Promise<StudentToday> {
    const { organizationId, student, local } = await this.context(user);
    const group = student.classGroup;

    const [period, rows] = await Promise.all([
      resolveCurrentPeriod(this.prisma, student.school.currentYear, local.date),
      group
        ? this.prisma.classGroupWeeklySchedule.findMany({
            where: { classGroupId: group.id, weekday: local.weekday, classGroup: { organizationId } },
            select: {
              id: true,
              startTime: true,
              endTime: true,
              location: true,
              remote: true,
              remoteLink: true,
              recess: true,
              course: {
                select: { id: true, name: true, teacher: { select: { firstName: true, fatherName: true } } },
              },
            },
            orderBy: [{ startTime: 'asc' }, { endTime: 'asc' }],
          })
        : Promise.resolve([]),
    ]);

    const slots: StudentSlot[] = rows.map(({ course, ...row }) => ({
      ...row,
      course: { id: course.id, name: course.name },
      teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.fatherName}`.trim() : null,
      state: timeState(row, local.time),
    }));
    const classes = slots.filter((s) => !s.recess);

    return {
      firstName: student.firstName,
      timezone: local.timezone,
      date: local.date,
      time: local.time,
      period: toHomePeriod(period),
      classGroup: group,
      now: classes.find((s) => s.state === 'NOW') ?? null,
      next: classes.find((s) => s.startTime > local.time) ?? null,
      slots,
    };
  }

  /** FR-HOM-001.14: work of the student's group due from today to +14 days, and overdue work of the last 7 days. */
  async work(user: AuthUserContext | undefined): Promise<StudentWork> {
    return this.workFor(await this.context(user));
  }

  async workFor({ organizationId, student, local }: StudentContext): Promise<StudentWork> {
    const group = student.classGroup;
    if (!group) return { timezone: local.timezone, today: local.date, classGroup: null, items: [] };

    const tz = local.timezone;
    const todayStart = localMidnight(local.date, tz);
    const now = this.clock.now();
    const dates = await this.prisma.assignmentDate.findMany({
      where: {
        classGroupId: group.id,
        date: {
          gte: localMidnight(addDays(local.date, -WORK_WINDOW.overdueDays), tz),
          lt: localMidnight(addDays(local.date, WORK_WINDOW.aheadDays + 1), tz),
        },
        assignment: { course: { organizationId } },
      },
      select: {
        date: true,
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            requireSubmission: true,
            course: { select: { id: true, name: true } },
            submissions: { where: { studentId: student.id }, select: { submittedAt: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const items: StudentWorkItem[] = dates
      .map(({ date, assignment }) => {
        const submission = assignment.submissions[0];
        return {
          assignmentId: assignment.id,
          title: assignment.title,
          type: assignment.type,
          requireSubmission: assignment.requireSubmission,
          course: assignment.course,
          dueAt: date.toISOString(),
          status: workStatus({ dueAt: date, requireSubmission: assignment.requireSubmission, submitted: !!submission }, now),
          submittedAt: submission ? submission.submittedAt.toISOString() : null,
        };
      })
      // Before today only what is still owed.
      .filter((item) => item.status === 'VENCIDA' || new Date(item.dueAt) >= todayStart)
      .sort(
        (a, b) =>
          Number(b.status === 'VENCIDA') - Number(a.status === 'VENCIDA') || a.dueAt.localeCompare(b.dueAt),
      );

    return { timezone: tz, today: local.date, classGroup: group, items };
  }

  /**
   * FR-HOM-001.13 KPIs, .16 per-course averages and recent grades on the student's scale, .17 habits.
   * Published grades only (BR-HOM-001.2); thresholds from the group's study plan (BR-HOM-001.1).
   */
  async progress(user: AuthUserContext | undefined): Promise<StudentProgress> {
    return this.progressFor(await this.context(user));
  }

  async progressFor(
    { organizationId, userId, student, local }: StudentContext,
    opts: { recentGrades?: number } = {},
  ): Promise<StudentProgress> {
    const group = student.classGroup;

    const [{ current, previous }, enrolled, planRow] = await Promise.all([
      resolvePeriodPair(this.prisma, student.school.currentYear, local.date),
      this.prisma.course.findMany({
        where: { organizationId, ...enrolledCourses({ id: student.id }) },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      group
        ? this.prisma.classGroup.findUnique({
            where: { id: group.id },
            select: {
              studyPlan: {
                select: { gradeMetric: { select: { maximum: true, minimumApproval: true, minimumExcellence: true } } },
              },
            },
          })
        : Promise.resolve(null),
    ]);
    const scale = toThresholds(planRow?.studyPlan?.gradeMetric);
    const periodIds = [current?.id, previous?.id].filter((id): id is string => Boolean(id));
    const attendanceTo = current ? minDate(current.endDate.toISOString().slice(0, 10), local.date) : null;

    const [scores, recent, attendanceRows, threads, habitMarks] = await Promise.all([
      periodIds.length
        ? this.prisma.studentGrade.findMany({
            where: {
              studentId: student.id,
              score: { not: null },
              grade: { published: true, periodId: { in: periodIds }, course: { organizationId } },
            },
            select: {
              studentId: true,
              score: true,
              grade: { select: { courseId: true, periodId: true, bucket: { select: { weight: true } } } },
            },
          })
        : Promise.resolve([]),
      this.prisma.studentGrade.findMany({
        where: { studentId: student.id, score: { not: null }, grade: { published: true, course: { organizationId } } },
        orderBy: { grade: { date: 'desc' } },
        take: opts.recentGrades ?? RECENT_GRADES,
        select: {
          id: true,
          score: true,
          grade: { select: { title: true, date: true, course: { select: { id: true, name: true } } } },
        },
      }),
      current && attendanceTo
        ? this.prisma.attendanceRecord.groupBy({
            by: ['status'],
            where: {
              studentId: student.id,
              attendanceSession: {
                organizationId,
                date: { gte: utcDate(current.startDate.toISOString().slice(0, 10)), lte: utcDate(attendanceTo) },
              },
            },
            _count: { _all: true },
          })
        : Promise.resolve(null),
      !userId
        ? Promise.resolve([])
        : this.prisma.communicationThread.findMany({
        where: {
          organizationId,
          deletedAt: null,
          status: { in: [ThreadStatus.ACTIVE, ThreadStatus.APPROVED] },
          participants: { some: { userId } },
        },
        select: {
          broadcast: true,
          participants: { where: { userId }, select: { lastReadAt: true } },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { senderId: true, createdAt: true },
          },
        },
      }),
      current && group
        ? this.prisma.studentHabitEvaluation.findMany({
            where: {
              studentId: student.id,
              habitEvaluation: { classGroupId: group.id, periodId: current.id, published: true },
            },
            select: { value: true, habitEvaluation: { select: { habitMetric: { select: { name: true, order: true } } } } },
          })
        : Promise.resolve(null),
    ]);

    const averages = weightedAverages(scores);
    const avgFor = (courseId: string, periodId: string | undefined) =>
      periodId ? averages.get(averageKey(student.id, courseId, periodId)) : undefined;
    const courses = enrolled.map((c) => {
      const avg = avgFor(c.id, current?.id);
      return {
        id: c.id,
        name: c.name,
        average: avg === undefined ? null : round1(avg),
        band: gradeBand(avg, scale),
      };
    });
    const mean = (periodId: string | undefined) => {
      const values = enrolled.map((c) => avgFor(c.id, periodId)).filter((v): v is number => v !== undefined);
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    };
    const now = mean(current?.id);
    const before = mean(previous?.id);

    let attendance: StudentProgress['attendance'] = null;
    if (attendanceRows) {
      const counts: AttendanceStatusCounts = {};
      for (const row of attendanceRows) addCount(counts, row.status, row._count._all);
      attendance = {
        rate: attendanceRate(counts),
        absences: counts[AttendanceStatus.ABSENT] ?? 0,
        late: counts[AttendanceStatus.LATE] ?? 0,
      };
    }

    const unread = threads.filter((t) => {
      const last = t.messages[0];
      if (!last || last.senderId === userId) return false;
      const lastReadAt = t.participants[0]?.lastReadAt;
      return !lastReadAt || last.createdAt > lastReadAt;
    });

    return {
      studentId: student.id,
      period: current ? { id: current.id, name: current.name } : null,
      previousPeriod: previous ? { id: previous.id, name: previous.name } : null,
      scale,
      average: {
        value: now === null ? null : round1(now),
        previous: before === null ? null : round1(before),
        delta: now !== null && before !== null ? round1(now - before) : null,
      },
      courses,
      recentGrades: recent.map((g) => {
        const score = g.score ? g.score.toNumber() : 0;
        return {
          id: g.id,
          title: g.grade.title,
          course: g.grade.course,
          score,
          band: gradeBand(score, scale),
          date: g.grade.date.toISOString(),
        };
      }),
      attendance,
      messages: {
        unread: unread.length,
        fromTeachers: unread.filter((t) => !t.broadcast).length,
        broadcasts: unread.filter((t) => t.broadcast).length,
      },
      habits: habitMarks ? habitsSummary(habitMarks) : null,
    };
  }

  /**
   * A linked child's context for the parent home. The caller must have checked the link
   * (BR-HOM-001.9); times, period and scale are the child's own school's.
   */
  async contextForStudent(studentId: string): Promise<StudentContext> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { ...STUDENT_SELECT, organizationId: true, userId: true },
    });
    if (!student) throw new ForbiddenException('No puedes ver la información de este estudiante');
    const { organizationId, userId, ...rest } = student;
    return { organizationId, userId, student: rest, local: schoolLocalTime(this.clock.now(), rest.school.timezone) };
  }

  /** BR-HOM-001.8: the caller's own Student record in their organization. */
  private async context(user: AuthUserContext | undefined): Promise<StudentContext> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const organizationId = user.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization context required');

    const student = await this.prisma.student.findFirst({
      where: { userId: user.userId, organizationId },
      select: STUDENT_SELECT,
    });
    if (!student) throw new ForbiddenException('No student profile in this organization');

    return {
      organizationId,
      userId: user.userId,
      student,
      local: schoolLocalTime(this.clock.now(), student.school.timezone),
    };
  }
}

/** BR-HOM-001.12 */
export function workStatus(
  item: { dueAt: Date; requireSubmission: boolean; submitted: boolean },
  now: Date,
): StudentWorkStatus {
  if (item.submitted) return 'ENTREGADO';
  if (!item.requireSubmission) return 'PRESENCIAL';
  return item.dueAt < now ? 'VENCIDA' : 'PENDIENTE';
}

function minDate(a: string, b: string) {
  return a < b ? a : b;
}

/** FR-HOM-001.17: S marks counted; R and X listed in the habits' display order. */
export function habitsSummary(
  marks: { value: HabitValue; habitEvaluation: { habitMetric: { name: string; order: number } } }[],
): StudentHabits {
  const flagged = marks
    .filter((m) => m.value !== HabitValue.S)
    .sort((a, b) => a.habitEvaluation.habitMetric.order - b.habitEvaluation.habitMetric.order)
    .map((m) => ({ name: m.habitEvaluation.habitMetric.name, value: m.value as 'R' | 'X' }));
  return { total: marks.length, satisfactory: marks.length - flagged.length, flagged };
}
