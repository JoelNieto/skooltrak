/**
 * Installments and due dates of a fee item for an academic year (FR-FIN-001.4, .6). Pure, so the
 * calendar rules are testable without a database.
 *
 * - Year `Y` of a school whose year starts in month `S`: a month >= S falls in calendar year Y, an
 *   earlier month in Y + 1 (a Mar–Dec school stays in Y; an Aug–Jun school spills into Y + 1).
 * - A due day past the month's end is clamped to its last day (31 → 28/29 in February).
 * - MONTHLY items run from `startMonth` to `endMonth` in school-year order, so Aug → Jun works.
 */

export type FeeScheduleKind = 'ONE_TIME' | 'MONTHLY';

export interface FeeScheduleSpec {
  schedule: FeeScheduleKind;
  dueMonth: number | null;
  startMonth: number | null;
  endMonth: number | null;
  dueDay: number;
}

export interface Installment {
  /** 1-based; always 1 for ONE_TIME. */
  index: number;
  /** Calendar month 1-12. */
  month: number;
  /** `YYYY-MM-DD` */
  dueDate: string;
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const SCHEDULE_INVALID = 'Configura el calendario del concepto';

/** Calendar year of `month` within academic year `year`. */
export function calendarYear(year: number, month: number, yearStartMonth: number): number {
  return month >= yearStartMonth ? year : year + 1;
}

/** Position of a month in the school year: the start month is 0. */
function schoolOrder(month: number, yearStartMonth: number): number {
  return (month - yearStartMonth + 12) % 12;
}

function isoDate(year: number, month: number, day: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const d = Math.min(Math.max(1, day), last);
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const isMonth = (m: number | null): m is number => m != null && Number.isInteger(m) && m >= 1 && m <= 12;

/** The reason a schedule is incomplete, or null when it is valid. */
export function scheduleError(spec: FeeScheduleSpec): string | null {
  if (!Number.isInteger(spec.dueDay) || spec.dueDay < 1 || spec.dueDay > 31) return 'El día de vencimiento debe estar entre 1 y 31';
  if (spec.schedule === 'ONE_TIME') return isMonth(spec.dueMonth) ? null : 'Indica el mes de vencimiento';
  if (!isMonth(spec.startMonth) || !isMonth(spec.endMonth)) return 'Indica el mes inicial y el final';
  return null;
}

export function installments(spec: FeeScheduleSpec, year: number, yearStartMonth: number): Installment[] {
  if (scheduleError(spec)) throw new Error(SCHEDULE_INVALID);
  if (spec.schedule === 'ONE_TIME') {
    const month = spec.dueMonth!;
    return [{ index: 1, month, dueDate: isoDate(calendarYear(year, month, yearStartMonth), month, spec.dueDay) }];
  }
  const first = schoolOrder(spec.startMonth!, yearStartMonth);
  const last = schoolOrder(spec.endMonth!, yearStartMonth);
  // An end before the start (in school-year order) wraps past the year's end.
  const count = (last - first + 12) % 12 + 1;
  const out: Installment[] = [];
  for (let i = 0; i < count; i++) {
    const month = ((spec.startMonth! - 1 + i) % 12) + 1;
    const calYear = calendarYear(year, month, yearStartMonth) + (schoolOrder(month, yearStartMonth) < first ? 1 : 0);
    out.push({ index: i + 1, month, dueDate: isoDate(calYear, month, spec.dueDay) });
  }
  return out;
}

/** "Mensualidad — marzo 2027" for a monthly installment; the item name for a one-time fee. */
export function installmentDescription(name: string, schedule: FeeScheduleKind, inst: Installment): string {
  if (schedule === 'ONE_TIME') return name;
  return `${name} — ${MONTHS[inst.month - 1]} ${inst.dueDate.slice(0, 4)}`;
}

/** "Mensual · mar–may · día 5" / "Único · 15 feb". */
export function scheduleLabel(spec: FeeScheduleSpec): string {
  if (spec.schedule === 'ONE_TIME') return `Único · ${spec.dueDay} ${SHORT_MONTHS[(spec.dueMonth ?? 1) - 1]}`;
  return `Mensual · ${SHORT_MONTHS[(spec.startMonth ?? 1) - 1]}–${SHORT_MONTHS[(spec.endMonth ?? 1) - 1]} · día ${spec.dueDay}`;
}
