import type { AuthUserContext } from '@/auth';
import { EnrollmentStatus, ImportJobStatus, Prisma, ThreadStatus } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ACTIVE_ENROLLMENT } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';
import { AdminAttention, AdminKpis } from './entities/admin-home.entity';
import { addCount, attendanceRate, AttendanceStatusCounts } from './home-attendance';
import { toThresholds } from './home-grades';
import { PeriodRef, resolvePeriodPair } from './home-period';
import { addDays, CLOCK, Clock, SchoolLocalTime, schoolLocalTime, utcDate } from './home-time';
import { periodClose } from './teacher-home.service';

/** `Perm.VIEW_FINANCIALS`, as a string to keep the auth guard stack out of unit tests. */
const VIEW_FINANCIALS = 'VIEW_FINANCIALS';
const ADMIN_ROLES = ['ORG_ADMIN', 'ADMIN', 'SYSADMIN'];
/** FR-HOM-001.24: import jobs looked at. */
export const FAILED_IMPORTS_DAYS = 30;

interface AdminContext {
  organizationId: string;
  userId: string;
  school: { id: string; name: string; currentYear: number; timezone: string; currencyCode: string };
  local: SchoolLocalTime;
  finance: boolean;
}

/** Weighted published average per student and course (one grouped query, BR-HOM-001.2). */
interface StudentCourseAverage {
  studentId: string;
  courseId: string;
  average: number;
}

/** School admin home read models (HOM-001). Scope: the caller's organization → one of its schools (BR-HOM-001.10). */
@Injectable()
export class AdminHomeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** FR-HOM-001.24 attention tiles and FR-HOM-001.5 period-close banner. */
  async attention(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<AdminAttention> {
    const ctx = await this.context(user, schoolId);
    const { organizationId, school, local } = ctx;
    const today = utcDate(local.date);

    const [me, { current }, joinRows, broadcastsToApprove, missedAttendance, overdueCharges, failedImports, plansWithoutScale] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: ctx.userId }, select: { firstName: true, name: true } }),
        resolvePeriodPair(this.prisma, school.currentYear, local.date),
        this.prisma.joinRequest.findMany({
          where: { schoolId: school.id, status: 'PENDING', school: { organizationId } },
          select: { requestedRole: true, createdAt: true },
        }),
        this.prisma.communicationThread.count({
          where: { organizationId, broadcast: true, status: ThreadStatus.PENDING_APPROVAL, deletedAt: null },
        }),
        this.missedAttendance(ctx),
        ctx.finance ? this.overdueCharges(ctx, today) : Promise.resolve(null),
        this.prisma.importJob.count({
          where: {
            organizationId,
            schoolId: school.id,
            createdAt: { gte: new Date(this.clock.now().getTime() - FAILED_IMPORTS_DAYS * 86_400_000) },
            OR: [{ status: ImportJobStatus.FAILED }, { errorCount: { gt: 0 } }],
          },
        }),
        this.prisma.studyPlan.count({ where: { schoolId: school.id, gradeMetricId: null } }),
      ]);

    const close = periodClose(current, local.date);
    const role = (r: string) => joinRows.filter((j) => j.requestedRole.toUpperCase() === r).length;
    const oldest = joinRows.map((j) => j.createdAt).sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      firstName: me?.firstName?.trim() || me?.name?.split(' ')[0] || '',
      school: { id: school.id, name: school.name },
      timezone: local.timezone,
      date: local.date,
      time: local.time,
      period: current ? { id: current.id, name: current.name } : null,
      periodClose: close && current ? { ...close, ...(await this.gradeCompleteness(ctx, current)) } : null,
      currencyCode: school.currencyCode,
      tiles: {
        joinRequests: {
          total: joinRows.length,
          teachers: role('TEACHER'),
          parents: role('PARENT'),
          others: joinRows.length - role('TEACHER') - role('PARENT'),
          oldestAt: oldest ? oldest.toISOString() : null,
        },
        broadcastsToApprove,
        missedAttendance,
        overdueCharges,
        failedImports,
        plansWithoutScale,
      },
    };
  }

  /** FR-HOM-001.25 KPI row. */
  async kpis(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<AdminKpis> {
    const ctx = await this.context(user, schoolId);
    const { organizationId, school, local } = ctx;
    const lastWeekStart = addDays(local.weekStart, -7);

    const [statusRows, todayRows, lastWeekRows, collection, { current }] = await Promise.all([
      this.prisma.student.groupBy({
        by: ['enrollmentStatus'],
        where: { organizationId, schoolId: school.id },
        _count: { _all: true },
      }),
      this.attendanceCounts(ctx, local.date, local.date),
      this.attendanceCounts(ctx, lastWeekStart, addDays(lastWeekStart, 6)),
      ctx.finance ? this.monthCollection(ctx) : Promise.resolve(null),
      resolvePeriodPair(this.prisma, school.currentYear, local.date),
    ]);
    const count = (s: EnrollmentStatus) => statusRows.find((r) => r.enrollmentStatus === s)?._count._all ?? 0;

    return {
      students: { active: count(EnrollmentStatus.ACTIVE), candidates: count(EnrollmentStatus.CANDIDATE) },
      attendanceToday: {
        rate: attendanceRate(todayRows),
        absent: todayRows.ABSENT ?? 0,
        late: todayRows.LATE ?? 0,
        lastWeekRate: attendanceRate(lastWeekRows),
      },
      collection,
      passing: current ? await this.passing(ctx, current.id) : null,
      currencyCode: school.currencyCode,
    };
  }

  /** BR-HOM-001.15 for the whole school: started, non-recess slots of today without a session. */
  private async missedAttendance({ organizationId, school, local }: AdminContext): Promise<number> {
    const slots = await this.prisma.classGroupWeeklySchedule.findMany({
      where: {
        weekday: local.weekday,
        recess: false,
        startTime: { lte: local.time },
        classGroup: { organizationId, schoolId: school.id, active: true },
      },
      select: { courseId: true, classGroupId: true },
    });
    if (!slots.length) return 0;
    const sessions = await this.prisma.attendanceSession.findMany({
      where: { organizationId, date: utcDate(local.date), classGroup: { schoolId: school.id } },
      select: { courseId: true, classGroupId: true },
    });
    const taken = new Set(sessions.map((s) => `${s.courseId}|${s.classGroupId}`));
    const missing = new Set(slots.map((s) => `${s.courseId}|${s.classGroupId}`).filter((k) => !taken.has(k)));
    return missing.size;
  }

  /** BR-HOM-001.14: the school's charges past due with an outstanding amount. */
  private async overdueCharges({ school }: AdminContext, today: Date) {
    const charges = await this.prisma.charge.findMany({
      where: { schoolId: school.id, dueDate: { lt: today } },
      select: {
        amount: true,
        studentId: true,
        payments: { select: { amount: true } },
        student: { select: { parents: { select: { id: true } } } },
      },
    });
    const open = charges
      .map((c) => ({
        ...c,
        outstanding: c.amount.toNumber() - c.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0),
      }))
      .filter((c) => c.outstanding > 0);
    const families = new Set(
      open.map((c) => {
        const parents = c.student.parents.map((p) => p.id).sort();
        return parents.length ? parents.join('+') : `student:${c.studentId}`;
      }),
    );
    return {
      count: open.length,
      amount: Math.round(open.reduce((sum, c) => sum + c.outstanding, 0) * 100) / 100,
      families: families.size,
    };
  }

  /** Courses of the school with at least one empty score cell in the period (FR-HOM-001.5). */
  private async gradeCompleteness({ organizationId, school }: AdminContext, period: PeriodRef) {
    const courses = await this.prisma.course.findMany({
      where: { organizationId, schoolId: school.id },
      select: {
        id: true,
        _count: { select: { enrollments: { where: { ...ACTIVE_ENROLLMENT, student: { enrollmentStatus: EnrollmentStatus.ACTIVE } } } } },
      },
    });
    const grades = courses.length
      ? await this.prisma.grade.findMany({
          where: { periodId: period.id, courseId: { in: courses.map((c) => c.id) } },
          select: {
            courseId: true,
            _count: {
              select: {
                studentGrades: { where: { score: { not: null }, student: { enrollmentStatus: EnrollmentStatus.ACTIVE } } },
              },
            },
          },
        })
      : [];
    const enrolled = new Map(courses.map((c) => [c.id, c._count.enrollments]));
    const missing = new Set(grades.filter((g) => (enrolled.get(g.courseId) ?? 0) > g._count.studentGrades).map((g) => g.courseId));
    return { coursesWithMissingGrades: missing.size, totalCourses: courses.length };
  }

  /** BR-HOM-001.5 counts of the school's records between two school-local dates. */
  private async attendanceCounts({ organizationId, school }: AdminContext, from: string, to: string) {
    const rows = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        attendanceSession: {
          organizationId,
          classGroup: { schoolId: school.id },
          date: { gte: utcDate(from), lte: utcDate(to) },
        },
      },
      _count: { _all: true },
    });
    const counts: AttendanceStatusCounts = {};
    for (const row of rows) addCount(counts, row.status, row._count._all);
    return counts;
  }

  /** Charges due in the school-local month and the payments made on them. */
  private async monthCollection({ school, local }: AdminContext) {
    const monthStart = `${local.date.slice(0, 7)}-01`;
    const next = new Date(`${monthStart}T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const charges = await this.prisma.charge.findMany({
      where: { schoolId: school.id, dueDate: { gte: utcDate(monthStart), lt: next } },
      select: { amount: true, payments: { select: { amount: true } } },
    });
    const billed = charges.reduce((sum, c) => sum + c.amount.toNumber(), 0);
    const collected = charges.reduce(
      (sum, c) => sum + Math.min(c.amount.toNumber(), c.payments.reduce((s, p) => s + p.amount.toNumber(), 0)),
      0,
    );
    return { rate: billed > 0 ? collected / billed : null, collected: round2(collected), billed: round2(billed) };
  }

  /** FR-HOM-001.25 "Aprobando todas las materias" against each course's plan scale (BR-HOM-001.1). */
  private async passing({ organizationId, school }: AdminContext, periodId: string) {
    const [averages, courses] = await Promise.all([
      this.courseAverages(organizationId, school.id, periodId),
      this.prisma.course.findMany({
        where: { organizationId, schoolId: school.id },
        select: {
          id: true,
          studyPlan: { select: { gradeMetric: { select: { maximum: true, minimumApproval: true, minimumExcellence: true } } } },
        },
      }),
    ]);
    const scales = new Map(courses.map((c) => [c.id, toThresholds(c.studyPlan?.gradeMetric)]));

    const byStudent = new Map<string, { below: boolean; allExcellent: boolean }>();
    for (const row of averages) {
      const scale = scales.get(row.courseId);
      if (!scale) continue;
      const entry = byStudent.get(row.studentId) ?? { below: false, allExcellent: true };
      if (row.average < scale.minimumApproval) entry.below = true;
      if (row.average < scale.minimumExcellence) entry.allExcellent = false;
      byStudent.set(row.studentId, entry);
    }
    const evaluated = byStudent.size;
    const belowPass = [...byStudent.values()].filter((e) => e.below).length;
    return {
      evaluated,
      rate: evaluated ? (evaluated - belowPass) / evaluated : null,
      belowPass,
      allExcellent: [...byStudent.values()].filter((e) => e.allExcellent).length,
    };
  }

  /**
   * Weighted average of published scores per active student and course in one grouped query
   * (same formula as grades.service.ts:getAverageScoreForStudent; NFR: no per-student queries).
   */
  private async courseAverages(organizationId: string, schoolId: string, periodId: string): Promise<StudentCourseAverage[]> {
    const rows = await this.prisma.$queryRaw<{ studentId: string; courseId: string; average: Prisma.Decimal | number | null }[]>(
      Prisma.sql`
        SELECT sg."studentId", g."courseId",
               SUM(sg."score" * b."weight") / NULLIF(SUM(b."weight"), 0) AS "average"
        FROM "student_grades" sg
        JOIN "grades" g ON g."id" = sg."gradeId"
        JOIN "grade_buckets" b ON b."id" = g."bucketId"
        JOIN "courses" c ON c."id" = g."courseId"
        JOIN "students" s ON s."id" = sg."studentId"
        WHERE g."published" = true
          AND g."periodId" = ${periodId}
          AND sg."score" IS NOT NULL
          AND c."schoolId" = ${schoolId}
          AND c."organizationId" = ${organizationId}
          AND s."enrollmentStatus" = 'ACTIVE'
        GROUP BY sg."studentId", g."courseId"`,
    );
    return rows
      .filter((r) => r.average !== null)
      .map((r) => ({ studentId: r.studentId, courseId: r.courseId, average: Number(r.average) }));
  }

  /** BR-HOM-001.10: a school of the caller's organization. */
  private async context(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<AdminContext> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const organizationId = user.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (!schoolId) throw new BadRequestException('schoolId is required');

    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, organizationId },
      select: { id: true, name: true, currentYear: true, timezone: true, currencyCode: true },
    });
    if (!school) throw new ForbiddenException('School not in your organization');

    const role = (user.role ?? '').toUpperCase();
    return {
      organizationId,
      userId: user.userId,
      school,
      local: schoolLocalTime(this.clock.now(), school.timezone),
      finance: ADMIN_ROLES.includes(role) || !!user.permissions?.includes(VIEW_FINANCIALS),
    };
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
