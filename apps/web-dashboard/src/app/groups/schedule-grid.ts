/**
 * Pure helpers for the group's weekly schedule editor: time maths, block layout, clash checks,
 * free slots, shared breaks and hours per course. No Angular here, so it is easy to unit test.
 */

export type WeekdayKey = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const WEEKDAYS: ReadonlyArray<{ key: WeekdayKey; label: string; short: string; chip: string }> = [
  { key: 'MONDAY', label: 'Lunes', short: 'Lun', chip: 'L' },
  { key: 'TUESDAY', label: 'Martes', short: 'Mar', chip: 'M' },
  { key: 'WEDNESDAY', label: 'Miércoles', short: 'Mié', chip: 'X' },
  { key: 'THURSDAY', label: 'Jueves', short: 'Jue', chip: 'J' },
  { key: 'FRIDAY', label: 'Viernes', short: 'Vie', chip: 'V' },
  { key: 'SATURDAY', label: 'Sábado', short: 'Sáb', chip: 'S' },
  { key: 'SUNDAY', label: 'Domingo', short: 'Dom', chip: 'D' },
];

export const dayLabel = (key: WeekdayKey) => WEEKDAYS.find((d) => d.key === key)?.label ?? key;

/** JS `Date.getDay()` (0 = Sunday) to our weekday key. */
export const weekdayOf = (date: Date): WeekdayKey =>
  (['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const)[date.getDay()];

export interface TimeRange {
  id?: string;
  weekday: WeekdayKey;
  startTime: string;
  endTime: string;
  recess?: boolean;
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** "1 h 30 min", "45 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}

export const snap = (minutes: number, step: number) => Math.round(minutes / step) * step;

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Half-open ranges on the same day; recess never clashes. */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  if (a.weekday !== b.weekday || a.recess || b.recess) return false;
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
}

export function firstClash<T extends TimeRange>(candidate: TimeRange, others: readonly T[]): T | undefined {
  return others.find((o) => o.id !== candidate.id && overlaps(candidate, o));
}

/** Pairs of slots of the same list that overlap (each pair once). */
export function clashingPairs<T extends TimeRange>(slots: readonly T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) if (overlaps(slots[i], slots[j])) pairs.push([slots[i], slots[j]]);
  }
  return pairs;
}

/** "jueves de 12:30 a 13:15" */
export const describeRange = (r: TimeRange) => `${dayLabel(r.weekday).toLowerCase()} de ${r.startTime} a ${r.endTime}`;

/** The visible hour window: at least 07:00–14:00, widened to fit every slot. */
export function hourWindow(slots: readonly TimeRange[]): { start: number; end: number } {
  let start = 7;
  let end = 14;
  for (const s of slots) {
    start = Math.min(start, Math.floor(toMinutes(s.startTime) / 60));
    end = Math.max(end, Math.ceil(toMinutes(s.endTime) / 60));
  }
  return { start, end: Math.min(end, 24) };
}

export interface Placed<T> {
  item: T;
  /** px from the top of the column */
  top: number;
  height: number;
  /** % of the column */
  left: number;
  width: number;
}

/**
 * Places a day's slots in the column, splitting overlapping ones into lanes so none hides another
 * (old data may still overlap; new writes are refused by the API).
 */
export function layoutDay<T extends TimeRange>(
  slots: readonly T[],
  window: { start: number; end: number },
  pxPerMinute: number,
): Array<Placed<T>> {
  const dayStart = window.start * 60;
  const dayEnd = window.end * 60;
  const prepared = slots
    .map((item) => ({
      item,
      start: Math.max(toMinutes(item.startTime), dayStart),
      end: Math.min(toMinutes(item.endTime), dayEnd),
    }))
    .filter((p) => p.end > p.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const placed: Array<Placed<T>> = [];
  let group: typeof prepared = [];
  let groupEnd = -Infinity;
  const flush = () => {
    const lanes: number[] = [];
    const withLane = group.map((p) => {
      let lane = lanes.findIndex((end) => end <= p.start);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(p.end);
      } else {
        lanes[lane] = p.end;
      }
      return { p, lane };
    });
    const width = 100 / Math.max(lanes.length, 1);
    for (const { p, lane } of withLane) {
      placed.push({
        item: p.item,
        top: (p.start - dayStart) * pxPerMinute,
        height: Math.max((p.end - p.start) * pxPerMinute, 20),
        left: lane * width,
        width,
      });
    }
  };
  for (const p of prepared) {
    if (p.start < groupEnd) {
      group.push(p);
      groupEnd = Math.max(groupEnd, p.end);
    } else {
      if (group.length) flush();
      group = [p];
      groupEnd = p.end;
    }
  }
  if (group.length) flush();
  return placed;
}

/**
 * Breaks the school days share: stretches inside the school day (after the first class, before
 * the last) that no day has a class in, and that sit between classes on at least two days
 * (e.g. 09:15–09:35 every day). A day that starts late or ends early does not hide a break.
 */
export function sharedBreaks(slots: readonly TimeRange[]): Array<{ startTime: string; endTime: string }> {
  const classes = slots.filter((s) => !s.recess);
  const days = [...new Set(classes.map((s) => s.weekday))];
  if (days.length < 2) return [];
  const busy = classes.map((s) => [toMinutes(s.startTime), toMinutes(s.endTime)] as const).sort((a, b) => a[0] - b[0]);
  const gaps: Array<[number, number]> = [];
  let cursor = busy[0][1];
  for (const [start, end] of busy.slice(1)) {
    if (start > cursor) gaps.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  const innerOn = (gap: [number, number]) =>
    days.filter((day) => {
      const own = classes.filter((s) => s.weekday === day);
      return own.some((s) => toMinutes(s.endTime) <= gap[0]) && own.some((s) => toMinutes(s.startTime) >= gap[1]);
    }).length;
  return gaps
    .filter(([s, e]) => e - s >= 10 && innerOn([s, e]) >= 2)
    .map(([s, e]) => ({ startTime: toTime(s), endTime: toTime(e) }));
}

/**
 * Class periods left empty: a time range used on some school day (Monday–Friday, plus the
 * weekend when it has classes) that is free on another one.
 */
export function freeSlots(slots: readonly TimeRange[], days: readonly WeekdayKey[]): TimeRange[] {
  const classes = slots.filter((s) => !s.recess);
  const usedDays = days.filter((d) => classes.some((s) => s.weekday === d));
  if (usedDays.length < 2) return [];
  const ranges = new Map<string, { startTime: string; endTime: string }>();
  for (const s of classes) ranges.set(`${s.startTime}-${s.endTime}`, { startTime: s.startTime, endTime: s.endTime });
  const free: TimeRange[] = [];
  for (const weekday of usedDays) {
    for (const r of ranges.values()) {
      const candidate = { weekday, ...r };
      if (!classes.some((s) => overlaps(candidate, s))) {
        // Keep one range per gap: skip one that overlaps a free range already kept.
        if (!free.some((f) => overlaps(f, candidate))) free.push(candidate);
      }
    }
  }
  const order = (k: WeekdayKey) => WEEKDAYS.findIndex((d) => d.key === k);
  return free.sort((a, b) => order(a.weekday) - order(b.weekday) || toMinutes(a.startTime) - toMinutes(b.startTime));
}

/** Minutes per key, in first-seen order. */
export function minutesBy<T extends TimeRange>(slots: readonly T[], key: (s: T) => string): Map<string, number> {
  const totals = new Map<string, number>();
  for (const s of slots) {
    if (s.recess) continue;
    const k = key(s);
    totals.set(k, (totals.get(k) ?? 0) + toMinutes(s.endTime) - toMinutes(s.startTime));
  }
  return totals;
}
