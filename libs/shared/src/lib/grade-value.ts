/**
 * ASM-001 BR .2: what a gradebook cell may hold. Shared by the API (refuses a save) and the grid
 * (flags the cell as the teacher types). `EX` (excused, BR .3) arrives in S05.
 */

export interface GradeScale {
  minimum: number;
  maximum: number;
}

export const NOT_A_NUMBER = 'Escribe un número';
export const ONE_DECIMAL = 'Máximo un decimal';
export const outOfRange = (scale: GradeScale) => `Entre ${formatScore(scale.minimum)} y ${formatScore(scale.maximum)}`;

/** Why a score is not valid on the scale, or null when it is: within [minimum, maximum], one decimal at most. */
export function scoreError(score: number, scale: GradeScale): string | null {
  if (!Number.isFinite(score)) return NOT_A_NUMBER;
  if (score < scale.minimum || score > scale.maximum) return outOfRange(scale);
  if (Math.abs(score * 10 - Math.round(score * 10)) > 1e-9) return ONE_DECIMAL;
  return null;
}

export type ParsedCell = { score: number | null; error: null } | { score: null; error: string };

/** Reads what the teacher typed: empty is no score; `4,5` and `4.5` are the same. */
export function parseCell(text: string, scale: GradeScale): ParsedCell {
  const value = text.trim().replace(',', '.');
  if (value === '') return { score: null, error: null };
  if (!/^[-+]?\d+(\.\d+)?$/.test(value) && !/^[-+]?\.\d+$/.test(value)) return { score: null, error: NOT_A_NUMBER };
  const score = Number(value);
  const error = scoreError(score, scale);
  return error ? { score: null, error } : { score, error: null };
}

/** `4` → "4", `4.5` → "4.5"; how a saved score is shown in an input. */
export function formatScore(score: number): string {
  return String(Math.round(score * 10) / 10);
}
