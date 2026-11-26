import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@generated/prisma';
import { PrismaService } from '../prisma.service';

export const HABIT_METRIC_NOT_FOR_SCHOOL = 'El hábito no corresponde al colegio';

type Db = PrismaService | Prisma.TransactionClient;

interface MetricRow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  order: number;
  schoolId?: string | null;
}

/** A habit metric as one school sees it. */
export interface EffectiveHabitMetric extends Omit<MetricRow, 'schoolId'> {
  /** True for the school's own metric, false for a global one. */
  custom: boolean;
}

const byOrder = (a: EffectiveHabitMetric, b: EffectiveHabitMetric) => a.order - b.order || a.name.localeCompare(b.name);

/** The school's own metrics when it has any, otherwise the global ones. Pure. */
export function pickSchoolHabitMetrics(rows: MetricRow[], schoolId: string | null | undefined): EffectiveHabitMetric[] {
  const custom = !!schoolId && rows.some((r) => r.schoolId === schoolId);
  return rows
    .filter((r) => (custom ? r.schoolId === schoolId : r.schoolId == null))
    .map(({ schoolId: owner, ...m }) => ({ ...m, custom: owner != null }))
    .sort(byOrder);
}

/** The habit metrics `schoolId` uses (all of them, or only active ones), by order. */
export async function loadSchoolHabitMetrics(
  prisma: Db,
  schoolId: string | null | undefined,
  options: { activeOnly?: boolean } = {},
): Promise<EffectiveHabitMetric[]> {
  const rows = await prisma.habitMetric.findMany({
    where: { OR: schoolId ? [{ schoolId: null }, { schoolId }] : [{ schoolId: null }] },
    select: { id: true, name: true, description: true, active: true, order: true, schoolId: true },
  });
  const metrics = pickSchoolHabitMetrics(rows, schoolId);
  return options.activeOnly ? metrics.filter((m) => m.active) : metrics;
}

/** True when the school uses its own habit metrics. */
export async function usesCustomHabitMetrics(prisma: Db, schoolId: string): Promise<boolean> {
  return (await prisma.habitMetric.count({ where: { schoolId } })) > 0;
}

/** 400 unless the metric is one the school uses (its own, or a global one while it has none). */
export async function assertHabitMetricForSchool(prisma: Db, habitMetricId: string, schoolId: string): Promise<void> {
  const metric = await prisma.habitMetric.findUnique({ where: { id: habitMetricId }, select: { schoolId: true } });
  if (!metric) throw new BadRequestException(HABIT_METRIC_NOT_FOR_SCHOOL);
  if (metric.schoolId != null) {
    if (metric.schoolId !== schoolId) throw new BadRequestException(HABIT_METRIC_NOT_FOR_SCHOOL);
    return;
  }
  if (await usesCustomHabitMetrics(prisma, schoolId)) throw new BadRequestException(HABIT_METRIC_NOT_FOR_SCHOOL);
}
