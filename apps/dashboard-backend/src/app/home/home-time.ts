import { WeekDay } from '@generated/prisma';

/** Injectable source of "now", so tests can pin the time (HOM-001). */
export const CLOCK = Symbol('HOME_CLOCK');

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** The school-local calendar position of an instant (BR-HOM-001.4). Dates are `YYYY-MM-DD`. */
export interface SchoolLocalTime {
  timezone: string;
  date: string;
  /** `HH:mm`, 24 h, same format as `ClassGroupWeeklySchedule.startTime`. */
  time: string;
  weekday: WeekDay;
  /** Monday of the current week. */
  weekStart: string;
  /** Sunday of the current week. */
  weekEnd: string;
}

const WEEKDAYS: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

export const FALLBACK_TIMEZONE = 'UTC';

function isValidTimezone(timezone: string | null | undefined): timezone is string {
  if (!timezone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** A `YYYY-MM-DD` calendar date as the UTC-midnight instant Prisma uses for `@db.Date` columns. */
export function utcDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function addDays(date: string, days: number): string {
  const d = utcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Where `now` falls on the school's wall clock. An unknown timezone falls back to UTC. */
export function schoolLocalTime(now: Date, timezone: string | null | undefined): SchoolLocalTime {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '00';

  const date = `${part('year')}-${part('month')}-${part('day')}`;
  const time = `${part('hour')}:${part('minute')}`;
  const dayIndex = utcDate(date).getUTCDay();
  const weekStart = addDays(date, -((dayIndex + 6) % 7));

  return {
    timezone: tz,
    date,
    time,
    weekday: WEEKDAYS[dayIndex],
    weekStart,
    weekEnd: addDays(weekStart, 6),
  };
}

/**
 * The UTC instant at which `date` (`YYYY-MM-DD`) starts on the school's wall clock, for range
 * filters on `DateTime` columns such as `AssignmentDate.date`. An unknown timezone falls back to UTC.
 */
export function localMidnight(date: string, timezone: string | null | undefined): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE;
  const guess = utcDate(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(guess);
  const n = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wallClockAsUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  const offset = wallClockAsUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcDate(to).getTime() - utcDate(from).getTime()) / 86_400_000);
}
