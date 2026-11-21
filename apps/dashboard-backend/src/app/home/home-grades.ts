import { courseAverage } from '@/shared';

/**
 * Grade helpers for the home dashboards (BR-HOM-001.1, .2, .11).
 * Averages use the product's one formula, `courseAverage` (ASM-001 BR .4): each bucket's mean,
 * weighted by bucket weight. A student with no scored grade has no average (`undefined`), not 0.
 */

export interface ScoredGradeRow {
  studentId: string;
  score: { toNumber(): number } | number | null;
  grade: { courseId: string; periodId: string; bucketId: string; bucket: { weight: { toNumber(): number } | number } };
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

/** Average per student, course and period (ASM-001 BR .4), keyed by `averageKey`. */
export function weightedAverages(rows: ScoredGradeRow[]): Map<string, number> {
  const cells = new Map<string, { bucketId: string; weight: number; score: number }[]>();
  for (const row of rows) {
    if (row.score === null) continue;
    const key = averageKey(row.studentId, row.grade.courseId, row.grade.periodId);
    const list = cells.get(key) ?? [];
    list.push({ bucketId: row.grade.bucketId, weight: num(row.grade.bucket.weight), score: num(row.score) });
    cells.set(key, list);
  }
  const averages = new Map<string, number>();
  for (const [key, list] of cells) {
    const average = courseAverage(list);
    if (average !== null) averages.set(key, average);
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
