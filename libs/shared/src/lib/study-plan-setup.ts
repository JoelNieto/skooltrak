/**
 * Study plan setup shared by the API and the dashboard: tuition periods and the plan names the
 * bulk and duplicate flows suggest.
 */

/** Spanish month names, 1-based (`MONTH_NAMES[1]` is "Enero"); index 0 is empty. */
export const MONTH_NAMES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export function isMonth(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12;
}

/**
 * The months a tuition period bills, in billing order. The range is inclusive and an end before
 * the start wraps over New Year: (8, 5) is Aug..Dec then Jan..May. A missing or invalid bound
 * gives no months.
 */
export function tuitionMonthsInRange(start: number | null | undefined, end: number | null | undefined): number[] {
  if (!isMonth(start) || !isMonth(end)) return [];
  const months: number[] = [];
  for (let m = start; ; m = (m % 12) + 1) {
    months.push(m);
    if (m === end) return months;
  }
}

/** Spanish ordinal abbreviation of a grade: 1 → "1°". */
export function gradeOrdinal(level: number): string {
  return `${level}°`;
}

/** The plan name suggested for a grade of a degree: (3, "Primaria") → "3° Primaria". */
export function suggestedPlanName(level: number, degreeName: string): string {
  return `${gradeOrdinal(level)} ${degreeName}`.trim();
}

/** The short name suggested for a grade of a degree: (3, "P") → "3° P". */
export function suggestedPlanShortName(level: number, degreeShortName: string): string {
  return `${gradeOrdinal(level)} ${degreeShortName}`.trim();
}
