import { AuthUserContext } from '@/auth';
import { AttendanceStatus } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { teacherClassGroupWhere, teacherCourseWhere } from '../teachers/teacher-scope';
import {
  HomePeriod,
  TeacherGroupRate,
  TeacherSlot,
  TeacherSlotState,
  TeacherSummary,
  TeacherToday,
} from './entities/teacher-home.entity';
import { addCount, attendanceRate, AttendanceStatusCounts } from './home-attendance';
import { PeriodRef, resolveCurrentPeriod } from './home-period';
import { CLOCK, Clock, schoolLocalTime, utcDate } from './home-time';

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

  /** FR-HOM-001.7 (attendance tile): attendance of the teacher's classes this week. */
  async summary(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<TeacherSummary> {
    const { organizationId, school, teacher, local } = await this.context(user, schoolId);

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
      weekStart: local.weekStart,
      weekEnd: local.weekEnd,
      attendance: {
        rate: attendanceRate(total),
        lowestGroup: groupRates.length >= 2 ? groupRates[0] : null,
      },
    };
  }

  /** BR-HOM-001.7 / .10: caller's org, a school of that org, and a teacher record in it. */
  private async context(user: AuthUserContext | undefined, schoolId: string | undefined) {
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

function toHomePeriod(period: PeriodRef | null): HomePeriod | null {
  return period ? { id: period.id, name: period.name, endDate: period.endDate.toISOString().slice(0, 10) } : null;
}

function sumCounts(counts: AttendanceStatusCounts) {
  return Object.values(counts).reduce<number>((sum, n) => sum + (n ?? 0), 0);
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}
