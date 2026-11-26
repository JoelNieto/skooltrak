import { Prisma } from '@generated/prisma';

/**
 * A study plan inherits its grade metric from its degree (level); the plan's non-null value
 * overrides the degree's. Read it through the helpers below, never from the plan's column alone.
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

type MetricSource<M> =
  | {
      gradeMetric?: M | null;
      degree?: { gradeMetric?: M | null } | null;
    }
  | null
  | undefined;

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
