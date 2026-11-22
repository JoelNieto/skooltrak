import { AuthUserContext } from '@/auth';
import { resolveCourseColor } from '@/shared';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { averageKey, round1, weightedAverages } from '../home/home-grades';
import { pickCurrentPeriod, pickPreviousPeriod } from '../home/home-period';
import { addDays, CLOCK, Clock, localMidnight, schoolLocalTime } from '../home/home-time';
import { workStatus } from '../home/student-home.service';
import { StudentWorkStatus } from '../home/entities/student-home.entity';
import { PrismaService } from '../prisma.service';
import { CourseCoverStorage } from './course-cover-storage';
import { courseSchedule, scheduleText } from './course-schedule';
import { enrolledCourses } from './course-roster';
import { MyCourseBand, MyCourseNext, MyCourses } from './entities/my-courses.entity';

export const NO_STUDENT = 'No student profile in this organization';
/** BR-ACA-001.2 */
export const NOT_LINKED = 'No puedes ver la información de este estudiante';
export const PERIOD_INVALID = 'El periodo no pertenece al año escolar actual';

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish) => (typeof v === 'number' ? v : v.toNumber());

/** BR-ACA-001.5 */
export function courseBand(average: number | null, passMark: number | null): MyCourseBand | null {
  if (average === null || passMark === null) return null;
  return Math.round(average * 10) / 10 < passMark ? 'EN_RIESGO' : 'AL_DIA';
}

/** BR-ACA-001.7: done is Entregada, Calificada or Exenta, or Presencial once its date has passed. */
export function isDone(status: StudentWorkStatus, dueAt: Date, now: Date): boolean {
  if (status === 'ENTREGADO' || status === 'CALIFICADA' || status === 'EXENTA') return true;
  return status === 'PRESENCIAL' && dueAt < now;
}

interface WorkItem {
  assignmentId: string;
  title: string;
  courseId: string;
  dueAt: Date;
  status: StudentWorkStatus;
}

/**
 * BR-ACA-001.8: the oldest overdue item, else the nearest one still to do (due now or later), else
 * none ("Nada pendiente").
 */
export function nextDelivery(items: WorkItem[], now: Date): MyCourseNext | null {
  const overdue = items.filter((i) => i.status === 'VENCIDA').sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0];
  if (overdue) return { assignmentId: overdue.assignmentId, title: overdue.title, dueAt: overdue.dueAt.toISOString(), overdue: true };
  const upcoming = items
    .filter((i) => i.dueAt >= now && (i.status === 'PENDIENTE' || i.status === 'PRESENCIAL'))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0];
  return upcoming
    ? { assignmentId: upcoming.assignmentId, title: upcoming.title, dueAt: upcoming.dueAt.toISOString(), overdue: false }
    : null;
}

const mean = (values: (number | null)[]) => {
  const scored = values.filter((v): v is number => v !== null);
  return scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
};

/** The student's *Mis cursos* (ACA-001-S02, S03: FR .4 .5 .6). Scope: BR-ACA-001.1. */
@Injectable()
export class CoursesMineService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly covers: CourseCoverStorage,
  ) {}

  /**
   * BR-HOM-001.8: the caller's own Student record in their organization; otherwise, with `studentId`,
   * a child linked to the caller (BR-ACA-001.2, BR-HOM-001.9; children may be in another organization).
   */
  private async resolveStudent(user: AuthUserContext, studentId: string | undefined) {
    const select = {
      id: true,
      organizationId: true,
      classGroup: { select: { id: true, name: true } },
      school: { select: { currentYear: true, timezone: true } },
    } as const;
    const own = user.organizationId
      ? await this.prisma.student.findFirst({ where: { userId: user.userId, organizationId: user.organizationId }, select })
      : null;
    if (own) return own;
    if (!studentId) throw new ForbiddenException(NO_STUDENT);
    const child = await this.prisma.student.findFirst({
      where: { id: studentId, parents: { some: { userId: user.userId } } },
      select,
    });
    if (!child) throw new ForbiddenException(NOT_LINKED);
    return child;
  }

  /**
   * A student's own courses, or, for a parent, those of the linked child `studentId` (S05). A student
   * caller's `studentId` is ignored (BR-ACA-001.2).
   */
  async mine(user: AuthUserContext | undefined, query: { periodId?: string; studentId?: string }): Promise<MyCourses> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const student = await this.resolveStudent(user, query.studentId);

    const now = this.clock.now();
    const local = schoolLocalTime(now, student.school.timezone);
    const periods = await this.prisma.period.findMany({
      where: { year: student.school.currentYear },
      select: { id: true, name: true, startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
    });
    const current = pickCurrentPeriod(periods, local.date);
    let selected = current;
    if (query.periodId) {
      selected = periods.find((p) => p.id === query.periodId) ?? null;
      if (!selected) throw new BadRequestException(PERIOD_INVALID);
    }
    const previous = pickPreviousPeriod(periods, selected);
    const isCurrentPeriod = !!selected && selected.id === current?.id;

    // BR-ACA-001.1 / .15: the courses the student is enrolled in.
    const courses = await this.prisma.course.findMany({
      where: { organizationId: student.organizationId, ...enrolledCourses({ id: student.id }) },
      select: {
        id: true,
        name: true,
        color: true,
        coverKey: true,
        subject: { select: { name: true, icon: true, area: true } },
        teacher: { select: { firstName: true, fatherName: true, user: { select: { color: true } } } },
        studyPlan: { select: { gradeMetric: { select: { maximum: true, minimumApproval: true } } } },
      },
    });
    const courseIds = courses.map((c) => c.id);
    const group = student.classGroup;
    const periodIds = [selected?.id, previous?.id].filter((id): id is string => !!id);

    const [slots, scores, dates] = await Promise.all([
      group && courseIds.length
        ? this.prisma.classGroupWeeklySchedule.findMany({
            where: { classGroupId: group.id, courseId: { in: courseIds } },
            select: { courseId: true, weekday: true, startTime: true, endTime: true, location: true, remote: true, recess: true },
          })
        : Promise.resolve([]),
      periodIds.length && courseIds.length
        ? this.prisma.studentGrade.findMany({
            // Published grades only (BR-HOM-001.2).
            where: { studentId: student.id, grade: { courseId: { in: courseIds }, periodId: { in: periodIds }, published: true } },
            select: {
              studentId: true,
              score: true,
              grade: { select: { courseId: true, periodId: true, bucketId: true, bucket: { select: { weight: true } } } },
            },
          })
        : Promise.resolve([]),
      // The group's work this school year (BR-ACA-001.7, .8, .10), with what the student did with it.
      group && courseIds.length && periods.length
        ? this.prisma.assignmentDate.findMany({
            where: {
              classGroupId: group.id,
              date: { gte: periods[0].startDate },
              assignment: { courseId: { in: courseIds } },
            },
            select: {
              date: true,
              assignment: {
                select: {
                  id: true,
                  title: true,
                  courseId: true,
                  requireSubmission: true,
                  submissions: { where: { studentId: student.id }, select: { id: true } },
                  grade: {
                    select: {
                      published: true,
                      studentGrades: { where: { studentId: student.id }, select: { score: true, excused: true } },
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);
    const averages = weightedAverages(scores);

    const work: WorkItem[] = dates.map(({ date, assignment }) => {
      const cell = assignment.grade?.published ? assignment.grade.studentGrades[0] : undefined;
      const graded = cell ? { score: cell.score === null ? null : num(cell.score), excused: cell.excused } : null;
      return {
        assignmentId: assignment.id,
        title: assignment.title,
        courseId: assignment.courseId,
        dueAt: date,
        status: workStatus(
          { dueAt: date, requireSubmission: assignment.requireSubmission, submitted: assignment.submissions.length > 0, graded },
          now,
        ),
      };
    });
    const inSelected = (i: WorkItem) => !!selected && i.dueAt >= selected.startDate && i.dueAt <= selected.endDate;

    const coverUrls = new Map(await Promise.all(courses.map(async (c) => [c.id, await this.covers.url(c.coverKey)] as const)));
    const cards = courses.map((course) => {
      const metric = course.studyPlan.gradeMetric;
      const scale = metric ? { maximum: num(metric.maximum), minimumApproval: num(metric.minimumApproval) } : null;
      const average = selected ? (averages.get(averageKey(student.id, course.id, selected.id)) ?? null) : null;
      const teacher = course.teacher;
      const own = work.filter((i) => i.courseId === course.id);
      const counted = own.filter(inSelected);
      return {
        id: course.id,
        name: course.name,
        color: resolveCourseColor(course.id, course.color),
        coverUrl: coverUrls.get(course.id) ?? null,
        subject: { name: course.subject.name, icon: course.subject.icon, area: course.subject.area },
        teacher: teacher
          ? {
              name: `${teacher.firstName} ${teacher.fatherName}`,
              initials: `${teacher.firstName.charAt(0)}${teacher.fatherName.charAt(0)}`,
              color: teacher.user?.color ?? null,
            }
          : null,
        schedule: scheduleText(courseSchedule(slots.filter((s) => s.courseId === course.id))),
        average,
        band: courseBand(average, scale?.minimumApproval ?? null),
        scale,
        // FR-ACA-001.5: Próxima entrega only for the current period.
        next: isCurrentPeriod ? nextDelivery(own, now) : null,
        progress: { done: counted.filter((i) => isDone(i.status, i.dueAt, now)).length, total: counted.length },
      };
    });
    cards.sort((a, b) => a.subject.name.localeCompare(b.subject.name, 'es') || a.name.localeCompare(b.name, 'es'));

    // FR-ACA-001.6: the stats row.
    const periodMean = (periodId: string | undefined) =>
      periodId ? mean(courses.map((c) => averages.get(averageKey(student.id, c.id, periodId)) ?? null)) : null;
    const value = periodMean(selected?.id);
    const before = periodMean(previous?.id);
    const weekStart = localMidnight(local.weekStart, local.timezone);
    const weekEnd = localMidnight(addDays(local.weekEnd, 1), local.timezone);
    const thisWeek = work.filter((i) => i.dueAt >= weekStart && i.dueAt < weekEnd);

    return {
      timezone: local.timezone,
      periods: periods.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
      })),
      periodId: selected?.id ?? null,
      isCurrentPeriod,
      classGroup: group,
      courses: cards,
      stats: {
        average: {
          value: value === null ? null : round1(value),
          previous: before === null ? null : round1(before),
          delta: value !== null && before !== null ? round1(value - before) : null,
        },
        week: { due: thisWeek.length, overdue: thisWeek.filter((i) => i.status === 'VENCIDA').length },
        done: cards.reduce((n, c) => n + c.progress.done, 0),
        total: cards.reduce((n, c) => n + c.progress.total, 0),
      },
    };
  }
}
