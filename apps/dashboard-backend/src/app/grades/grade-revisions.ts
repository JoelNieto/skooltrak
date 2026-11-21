import { Prisma } from '@generated/prisma';

/**
 * Revisions of published scores (ASM-001 BR .8). Every write path that can change a published score
 * goes through here: the gradebook save and the grade page's `PATCH` / `POST /student-grades`.
 * Draft columns write no revision; revisions are never edited or deleted.
 */

export const REASON_REQUIRED = 'Indica el motivo del cambio';
export const COMMENT_TOO_LONG = 'El comentario admite 500 caracteres como máximo';
export const REASON_MIN = 3;
export const REASON_MAX = 300;
/** BR-ASM-001.14 */
export const COMMENT_MAX = 500;

/** The reason as it is stored, or null when it breaks BR .8 (3–300 characters once trimmed). */
export function validReason(reason: string | null | undefined): string | null {
  const trimmed = reason?.trim() ?? '';
  return trimmed.length >= REASON_MIN && trimmed.length <= REASON_MAX ? trimmed : null;
}

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish | null | undefined) => (v === null || v === undefined ? null : typeof v === 'number' ? v : v.toNumber());

/** True when the stored score and the new one differ (both may be empty). */
export function scoreChanged(previous: Decimalish | null | undefined, next: number | null | undefined): boolean {
  return num(previous) !== (next ?? null);
}

export interface RevisionInput {
  studentGradeId: string;
  previousScore: Decimalish | null;
  score: number | null;
  reason: string;
}

/** Writes one revision per changed published cell, in the caller's transaction. */
export async function recordRevisions(
  tx: Pick<Prisma.TransactionClient, 'studentGradeRevision'>,
  revisions: RevisionInput[],
  changedById: string | null,
): Promise<void> {
  if (!revisions.length) return;
  await tx.studentGradeRevision.createMany({
    data: revisions.map((r) => ({
      studentGradeId: r.studentGradeId,
      previousScore: num(r.previousScore),
      score: r.score,
      reason: r.reason,
      changedById,
    })),
  });
}
