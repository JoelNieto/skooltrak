import type { AuthUserContext } from '@/auth';
import { AttendanceStatus } from '@generated/prisma';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StudentProgress, StudentWork } from './entities/student-home.entity';
import { ParentAlert, ParentChildHome, ParentChildren, ParentKpis } from './entities/parent-home.entity';
import { addDays, utcDate } from './home-time';
import { StudentContext, StudentHomeService } from './student-home.service';

/** BR-HOM-001.9 / FR-HOM-001.19 windows, fixed in v1 (Q5). */
export const PARENT_ALERTS = { absenceDays: 7, chargeDueDays: 7, late: 3 } as const;

const NOT_LINKED = 'No puedes ver la información de este estudiante';
/** `Perm.VIEW_FINANCIALS` */
const VIEW_FINANCIALS = 'VIEW_FINANCIALS';

interface ChildFacts {
  ctx: StudentContext;
  work: StudentWork;
  progress: StudentProgress;
  /** ABSENT records of the last 7 days, newest first. */
  absences: { date: Date; course: string }[];
  lateThisWeek: number;
  /** Null without VIEW_FINANCIALS. */
  finance: {
    balance: number;
    overdue: { description: string; outstanding: number; dueDate: Date }[];
    dueSoon: { description: string; outstanding: number; dueDate: Date }[];
  } | null;
  currencyCode: string;
}

/** Parent home read models (HOM-001, parent sections). Scope: the caller's linked children (BR-HOM-001.9). */
@Injectable()
export class ParentHomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHome: StudentHomeService,
  ) {}

  /** FR-HOM-001.18: one entry per linked child with its alert count, and the default selection. */
  async children(user: AuthUserContext | undefined): Promise<ParentChildren> {
    const userId = requireUser(user);
    const [parents, me] = await Promise.all([
      this.prisma.parent.findMany({
        where: { userId },
        select: {
          students: {
            select: {
              id: true,
              firstName: true,
              fatherName: true,
              organizationId: true,
              classGroup: { select: { id: true, name: true } },
              school: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, name: true } }),
    ]);
    if (!parents.length) throw new ForbiddenException('No parent profile');

    const byId = new Map(parents.flatMap((p) => p.students).map((s) => [s.id, s]));
    const finance = canSeeFinance(user);
    const children = await Promise.all(
      [...byId.values()].map(async (s) => {
        const facts = await this.facts(s.id, finance);
        return {
          studentId: s.id,
          name: `${s.firstName} ${s.fatherName}`.trim(),
          organizationId: s.organizationId,
          classGroup: s.classGroup,
          school: s.school,
          alertCount: buildAlerts(facts).length,
        };
      }),
    );
    children.sort((a, b) => a.name.localeCompare(b.name));
    const preferred = [...children].sort((a, b) => b.alertCount - a.alertCount || a.name.localeCompare(b.name))[0];

    return {
      firstName: me?.firstName?.trim() || me?.name?.split(' ')[0] || '',
      defaultStudentId: preferred?.studentId ?? null,
      children,
    };
  }

  /** FR-HOM-001.19 alerts and FR-HOM-001.20 KPIs of one linked child. */
  async child(user: AuthUserContext | undefined, studentId: string): Promise<ParentChildHome> {
    const userId = requireUser(user);
    const linked = await this.prisma.student.findFirst({
      where: { id: studentId, parents: { some: { userId } } },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        classGroup: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
      },
    });
    if (!linked) throw new ForbiddenException(NOT_LINKED);

    const facts = await this.facts(linked.id, canSeeFinance(user));
    const { progress, work, finance } = facts;
    const kpis: ParentKpis = {
      average: {
        value: progress.average.value,
        max: progress.scale?.maximum ?? null,
        delta: progress.average.delta,
        previousPeriodName: progress.previousPeriod?.name ?? null,
      },
      attendance: progress.attendance,
      pending: {
        total: work.items.filter((i) => i.status === 'PENDIENTE' || i.status === 'VENCIDA').length,
        overdue: work.items.filter((i) => i.status === 'VENCIDA').length,
      },
      balance: finance
        ? { amount: finance.balance, overdue: finance.overdue.reduce((sum, c) => sum + c.outstanding, 0) }
        : null,
    };

    return {
      student: {
        id: linked.id,
        name: `${linked.firstName} ${linked.fatherName}`.trim(),
        firstName: linked.firstName,
        classGroup: linked.classGroup,
        school: linked.school,
      },
      currencyCode: facts.currencyCode,
      alerts: buildAlerts(facts),
      kpis,
    };
  }

  /** Everything the alerts and KPIs need for one child, from the child's own school. */
  private async facts(studentId: string, withFinance: boolean): Promise<ChildFacts> {
    const ctx = await this.studentHome.contextForStudent(studentId);
    const { local } = ctx;
    const today = utcDate(local.date);

    const [work, progress, absenceRows, lateThisWeek, school, charges, payments] = await Promise.all([
      this.studentHome.workFor(ctx),
      this.studentHome.progressFor(ctx),
      this.prisma.attendanceRecord.findMany({
        where: {
          studentId,
          status: AttendanceStatus.ABSENT,
          attendanceSession: {
            organizationId: ctx.organizationId,
            date: { gte: utcDate(addDays(local.date, -(PARENT_ALERTS.absenceDays - 1))), lte: today },
          },
        },
        select: { attendanceSession: { select: { date: true, course: { select: { name: true } } } } },
        orderBy: { attendanceSession: { date: 'desc' } },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          studentId,
          status: AttendanceStatus.LATE,
          attendanceSession: {
            organizationId: ctx.organizationId,
            date: { gte: utcDate(local.weekStart), lte: utcDate(local.weekEnd) },
          },
        },
      }),
      this.prisma.school.findUnique({ where: { id: ctx.student.school.id }, select: { currencyCode: true } }),
      withFinance
        ? this.prisma.charge.findMany({
            where: { studentId },
            select: { id: true, amount: true, dueDate: true, description: true },
            orderBy: { dueDate: 'asc' },
          })
        : Promise.resolve(null),
      withFinance
        ? this.prisma.payment.findMany({ where: { studentId }, select: { chargeId: true, amount: true } })
        : Promise.resolve(null),
    ]);

    let finance: ChildFacts['finance'] = null;
    if (charges && payments) {
      // Same rules as payments.service.ts:getStudentBalanceSummary (BR-HOM-001.14).
      const paidByCharge = new Map<string, number>();
      for (const p of payments) {
        if (p.chargeId) paidByCharge.set(p.chargeId, (paidByCharge.get(p.chargeId) ?? 0) + p.amount.toNumber());
      }
      const soonLimit = utcDate(addDays(local.date, PARENT_ALERTS.chargeDueDays));
      const open = charges
        .map((c) => ({
          description: c.description,
          dueDate: c.dueDate,
          outstanding: c.amount.toNumber() - (paidByCharge.get(c.id) ?? 0),
        }))
        .filter((c) => c.outstanding > 0);
      finance = {
        balance:
          charges.reduce((sum, c) => sum + c.amount.toNumber(), 0) -
          payments.reduce((sum, p) => sum + p.amount.toNumber(), 0),
        overdue: open.filter((c) => c.dueDate < today),
        dueSoon: open.filter((c) => c.dueDate >= today && c.dueDate <= soonLimit),
      };
    }

    return {
      ctx,
      work,
      progress,
      absences: absenceRows.map((r) => ({ date: r.attendanceSession.date, course: r.attendanceSession.course.name })),
      lateThisWeek,
      finance,
      currencyCode: school?.currencyCode ?? 'USD',
    };
  }
}

/** FR-HOM-001.19: danger alerts first, then warnings. */
export function buildAlerts(facts: ChildFacts): ParentAlert[] {
  const alerts: ParentAlert[] = [];
  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: facts.currencyCode });
  const day = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const write = { label: 'Escribir al docente', link: '/parent/communication' };
  const progressLink = { label: 'Ver progreso', link: '/parent/progress' };
  const account = { label: 'Ver estado de cuenta', link: '/parent/finances' };

  if (facts.absences.length) {
    const latest = facts.absences[0];
    alerts.push({
      kind: 'ABSENCE',
      tone: 'danger',
      title: facts.absences.length === 1 ? 'Ausencia sin justificar' : `${facts.absences.length} ausencias sin justificar`,
      detail: `${capitalize(day.format(latest.date))} · ${latest.course}`,
      action: write,
    });
  }

  const scale = facts.progress.scale;
  if (scale) {
    for (const course of facts.progress.courses.filter((c) => c.band === 'BELOW' && c.average !== null)) {
      alerts.push({
        kind: 'BELOW_PASS',
        tone: 'danger',
        title: `Nota baja en ${course.name}`,
        detail: `Promedio ${course.average?.toFixed(1)} · mínimo para aprobar ${scale.minimumApproval.toFixed(1)}`,
        action: write,
      });
    }
  }

  if (facts.finance?.overdue.length) {
    const total = facts.finance.overdue.reduce((sum, c) => sum + c.outstanding, 0);
    const first = facts.finance.overdue[0];
    alerts.push({
      kind: 'CHARGE_OVERDUE',
      tone: 'danger',
      title: facts.finance.overdue.length === 1 ? 'Pago vencido' : `${facts.finance.overdue.length} pagos vencidos`,
      detail: facts.finance.overdue.length === 1 ? `${first.description || 'Cargo'} · ${money.format(total)}` : `${money.format(total)} pendientes`,
      action: account,
    });
  }

  const overdueWork = facts.work.items.filter((i) => i.status === 'VENCIDA');
  if (overdueWork.length) {
    const oldest = overdueWork[0];
    alerts.push({
      kind: 'OVERDUE_WORK',
      tone: 'warning',
      title: overdueWork.length === 1 ? 'Tarea vencida' : `${overdueWork.length} tareas vencidas`,
      detail: `${oldest.title} · ${oldest.course.name}`,
      action: progressLink,
    });
  }

  if (facts.finance?.dueSoon.length) {
    const next = facts.finance.dueSoon[0];
    alerts.push({
      kind: 'CHARGE_DUE_SOON',
      tone: 'warning',
      title: 'Pago próximo a vencer',
      detail: `${next.description || 'Cargo'} · ${money.format(next.outstanding)} · vence ${day.format(next.dueDate)}`,
      action: account,
    });
  }

  if (facts.lateThisWeek >= PARENT_ALERTS.late) {
    alerts.push({
      kind: 'LATE',
      tone: 'warning',
      title: `${facts.lateThisWeek} tardanzas esta semana`,
      detail: 'Registradas por sus docentes',
      action: progressLink,
    });
  }

  return alerts;
}

function requireUser(user: AuthUserContext | undefined): string {
  if (!user?.userId) throw new ForbiddenException('Not authenticated');
  return user.userId;
}

/** BR-HOM-001.16: finance figures only with VIEW_FINANCIALS (admins pass any check). */
function canSeeFinance(user: AuthUserContext | undefined) {
  const role = (user?.role ?? '').toUpperCase();
  // The key as a string: importing `Perm` from '@/auth' at runtime would load the auth guard stack.
  return ['ORG_ADMIN', 'ADMIN', 'SYSADMIN'].includes(role) || !!user?.permissions?.includes(VIEW_FINANCIALS);
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
