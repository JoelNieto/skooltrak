/**
 * The one course average of the product (ASM-001 BR .4, decided 2026-11-19): the API, the home
 * pages, the grade report and every UI compute it here.
 *
 * 1. For each bucket, take the mean of the student's scored cells.
 * 2. Weight those means: Σ(mean_b × weight_b) ÷ Σ weight_b, over the buckets with a scored cell.
 *
 * Empty cells are skipped (excused cells, ASM-001-S05, arrive here without a score). With no scored
 * cell, or only zero-weight buckets, there is no average: `null`, never 0.
 *
 * Example: Trabajo diario 40 (4, 4, 4, 4) and Pruebas 60 (2) give 2.8.
 */
export interface AverageCell {
  bucketId: string;
  /** The bucket's weight, as stored (a percentage, or any relative weight). */
  weight: number;
  score: number | null | undefined;
}

export function courseAverage(cells: Iterable<AverageCell>): number | null {
  const buckets = new Map<string, { sum: number; count: number; weight: number }>();
  for (const cell of cells) {
    if (cell.score === null || cell.score === undefined || Number.isNaN(cell.score)) continue;
    const bucket = buckets.get(cell.bucketId) ?? { sum: 0, count: 0, weight: cell.weight };
    bucket.sum += cell.score;
    bucket.count += 1;
    buckets.set(cell.bucketId, bucket);
  }

  let weighted = 0;
  let totalWeight = 0;
  for (const { sum, count, weight } of buckets.values()) {
    weighted += (sum / count) * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weighted / totalWeight : null;
}

/**
 * ASM-001 BR .5 status band, from the student's course average and the study plan's pass mark:
 * - `AT_RISK` ("En riesgo"): below the pass mark;
 * - `WATCH` ("Atención"): below the pass mark + {@link WATCH_MARGIN};
 * - `ON_TRACK` ("Al día"): otherwise.
 *
 * The band is taken from the average rounded to one decimal, as it is shown, so a "3.0" never reads
 * "En riesgo" with a 3.0 pass mark. No average or no pass mark: no band.
 */
export type GradeStatus = 'AT_RISK' | 'WATCH' | 'ON_TRACK';

export const WATCH_MARGIN = 0.5;

export function gradeStatus(average: number | null | undefined, passMark: number | null | undefined): GradeStatus | null {
  if (average === null || average === undefined || Number.isNaN(average)) return null;
  if (passMark === null || passMark === undefined) return null;
  const shown = Math.round(average * 10) / 10;
  if (shown < passMark) return 'AT_RISK';
  return shown < passMark + WATCH_MARGIN ? 'WATCH' : 'ON_TRACK';
}

/** Plain mean of the values that are numbers; null when there are none. */
export function meanOf(values: Iterable<number | null | undefined>): number | null {
  let sum = 0;
  let count = 0;
  for (const value of values) {
    if (value === null || value === undefined || Number.isNaN(value)) continue;
    sum += value;
    count += 1;
  }
  return count ? sum / count : null;
}
