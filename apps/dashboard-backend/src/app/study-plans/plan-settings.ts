import { tuitionMonthsInRange } from '@/shared';
import { Prisma } from '@generated/prisma';

/**
 * A study plan inherits its grade metric and financial settings from its degree (level). A plan's
 * own value overrides the degree's when it is set:
 *
 * - grade metric and monthly tuition: the plan's non-null value;
 * - tuition period: the plan's start-end pair, when its start is set;
 * - enrollment costs: the plan's list, when it has at least one cost.
 *
 * Read these settings through the helpers below, never from the plan's columns alone.
 */

/** Selects a plan's grade metric and its degree's, with the same metric fields. */
export function planMetricSelect<S extends Prisma.GradeMetricSelect>(select: S) {
  return {
    gradeMetric: { select },
    degree: { select: { gradeMetric: { select } } },
  } as const;
}

/** Includes a plan's full grade metric and its degree's. */
export const PLAN_METRIC_INCLUDE = {
  gradeMetric: true,
  degree: { include: { gradeMetric: true } },
} as const;

type MetricSource<M> = {
  gradeMetric?: M | null;
  degree?: { gradeMetric?: M | null } | null;
} | null | undefined;

/** The plan's grade metric, else its degree's (null when neither has one). */
export function effectiveGradeMetric<M>(plan: MetricSource<M>): M | null {
  return plan?.gradeMetric ?? plan?.degree?.gradeMetric ?? null;
}

/** The plan with `gradeMetric` replaced by the effective one, for responses the UI reads as is. */
export function withEffectiveMetric<P extends { gradeMetric?: unknown; degree?: { gradeMetric?: unknown } | null }>(
  plan: P,
): P {
  return { ...plan, gradeMetric: effectiveGradeMetric(plan) };
}

/** Where a plan's grade metric is missing: neither the plan nor its degree has one. */
export const PLAN_WITHOUT_METRIC: Prisma.StudyPlanWhereInput = {
  gradeMetricId: null,
  degree: { gradeMetricId: null },
};

/** The financial settings a plan resolves, plus the degree's for the fallback. */
export const PLAN_FINANCIAL_INCLUDE = {
  enrollmentCosts: { orderBy: { order: 'asc' } },
  degree: { include: { enrollmentCosts: { orderBy: { order: 'asc' } } } },
} as const satisfies Prisma.StudyPlanInclude;

type Cost = { name: string; amount: Prisma.Decimal; order: number };
type FinancialFields = {
  monthlyTuitionAmount: Prisma.Decimal | null;
  tuitionStartMonth: number | null;
  tuitionEndMonth: number | null;
  enrollmentCosts: Cost[];
};

export interface EffectiveFinancials {
  monthlyTuitionAmount: Prisma.Decimal | null;
  tuitionStartMonth: number | null;
  tuitionEndMonth: number | null;
  /** The billed months, in billing order (see `tuitionMonthsInRange`). */
  tuitionMonths: number[];
  enrollmentCosts: Cost[];
}

/** The plan's financial settings after inheriting from its degree. */
export function effectiveFinancials(plan: FinancialFields & { degree: FinancialFields | null }): EffectiveFinancials {
  const degree = plan.degree;
  const ownPeriod = plan.tuitionStartMonth != null;
  const tuitionStartMonth = ownPeriod ? plan.tuitionStartMonth : (degree?.tuitionStartMonth ?? null);
  const tuitionEndMonth = ownPeriod ? plan.tuitionEndMonth : (degree?.tuitionEndMonth ?? null);
  return {
    monthlyTuitionAmount: plan.monthlyTuitionAmount ?? degree?.monthlyTuitionAmount ?? null,
    tuitionStartMonth,
    tuitionEndMonth,
    tuitionMonths: tuitionMonthsInRange(tuitionStartMonth, tuitionEndMonth),
    enrollmentCosts: plan.enrollmentCosts.length > 0 ? plan.enrollmentCosts : (degree?.enrollmentCosts ?? []),
  };
}
