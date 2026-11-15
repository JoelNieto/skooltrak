import { AttendanceStatus } from '@generated/prisma';

export type AttendanceStatusCounts = Partial<Record<AttendanceStatus, number>>;

/**
 * BR-HOM-001.5: (PRESENT + LATE) ÷ (all records − EXCUSED − SICK_LEAVE), as a fraction 0–1.
 * `null` when nothing counts toward the rate.
 */
export function attendanceRate(counts: AttendanceStatusCounts): number | null {
  const n = (s: AttendanceStatus) => counts[s] ?? 0;
  const total = Object.values(counts).reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const denominator = total - n(AttendanceStatus.EXCUSED) - n(AttendanceStatus.SICK_LEAVE);
  if (denominator <= 0) return null;
  return (n(AttendanceStatus.PRESENT) + n(AttendanceStatus.LATE)) / denominator;
}

/** Adds one `groupBy` row (`status`, `_count._all`) into a running tally. */
export function addCount(counts: AttendanceStatusCounts, status: AttendanceStatus, count: number) {
  counts[status] = (counts[status] ?? 0) + count;
}
