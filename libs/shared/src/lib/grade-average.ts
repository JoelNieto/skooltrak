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
