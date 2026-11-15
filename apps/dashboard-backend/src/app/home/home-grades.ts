/**
 * Grade helpers for the home dashboards (BR-HOM-001.1, .2, .11).
 * Same formula as `grades.service.ts:getAverageScoreForStudent`: published scores weighted by bucket
 * weight. Unlike it, a student with no scored grade has no average (`undefined`), not 0.
 */

export interface ScoredGradeRow {
  studentId: string;
  score: { toNumber(): number } | number | null;
  grade: { courseId: string; periodId: string; bucket: { weight: { toNumber(): number } | number } };
}

/** The study plan's grade metric, as numbers. */
export interface GradeThresholds {
  maximum: number;
  minimumApproval: number;
  minimumExcellence: number;
}

const num = (v: { toNumber(): number } | number) => (typeof v === 'number' ? v : v.toNumber());

export const averageKey = (studentId: string, courseId: string, periodId: string) =>
  `${studentId}|${courseId}|${periodId}`;

/** Weighted average per student, course and period, keyed by `averageKey`. */
export function weightedAverages(rows: ScoredGradeRow[]): Map<string, number> {
  const sums = new Map<string, { weighted: number; weight: number }>();
  for (const row of rows) {
    if (row.score === null) continue;
    const key = averageKey(row.studentId, row.grade.courseId, row.grade.periodId);
    const weight = num(row.grade.bucket.weight);
    const acc = sums.get(key) ?? { weighted: 0, weight: 0 };
    acc.weighted += num(row.score) * weight;
    acc.weight += weight;
    sums.set(key, acc);
  }
  const averages = new Map<string, number>();
  for (const [key, { weighted, weight }] of sums) {
    if (weight > 0) averages.set(key, weighted / weight);
  }
  return averages;
}

export function toThresholds(
  metric: { maximum: { toNumber(): number } | number; minimumApproval: { toNumber(): number } | number; minimumExcellence: { toNumber(): number } | number } | null | undefined,
): GradeThresholds | null {
  if (!metric) return null;
  return {
    maximum: num(metric.maximum),
    minimumApproval: num(metric.minimumApproval),
    minimumExcellence: num(metric.minimumExcellence),
  };
}

/** One decimal, as grades are shown. */
export const round1 = (n: number) => Math.round(n * 10) / 10;

export type GradeBand = 'EXCELLENT' | 'PASSING' | 'BELOW';

/** BR-HOM-001.1 bands on the study plan's scale; null without a scale. */
export function gradeBand(score: number | null | undefined, scale: GradeThresholds | null): GradeBand | null {
  if (score === null || score === undefined || !scale) return null;
  if (score >= scale.minimumExcellence) return 'EXCELLENT';
  return score >= scale.minimumApproval ? 'PASSING' : 'BELOW';
}
