import { AuthUserContext } from '@/auth';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  StudentSlot,
  StudentToday,
  StudentWork,
  StudentWorkItem,
  StudentWorkStatus,
} from './entities/student-home.entity';
import { resolveCurrentPeriod, toHomePeriod } from './home-period';
import { timeState } from './home-schedule';
import { addDays, CLOCK, Clock, localMidnight, SchoolLocalTime, schoolLocalTime } from './home-time';

/** FR-HOM-001.14 window. */
export const WORK_WINDOW = { aheadDays: 14, overdueDays: 7 } as const;

interface StudentContext {
  organizationId: string;
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
    const { organizationId, student, local } = await this.context(user);
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

  /** BR-HOM-001.8: the caller's own Student record in their organization. */
  private async context(user: AuthUserContext | undefined): Promise<StudentContext> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const organizationId = user.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization context required');

    const student = await this.prisma.student.findFirst({
      where: { userId: user.userId, organizationId },
      select: {
        id: true,
        firstName: true,
        classGroup: { select: { id: true, name: true } },
        school: { select: { id: true, currentYear: true, timezone: true } },
      },
    });
    if (!student) throw new ForbiddenException('No student profile in this organization');

    return { organizationId, student, local: schoolLocalTime(this.clock.now(), student.school.timezone) };
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
