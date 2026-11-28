import { WeekDay } from '@generated/prisma';

/**
 * Clash rules for a class group's weekly schedule:
 * - a group can't have two classes at the same time;
 * - a teacher can't be in two groups at the same time.
 * Ranges are half-open ("07:00–07:45" and "07:45–08:30" don't clash). Recess slots never clash.
 */

export const DAY_NAMES: Record<WeekDay, string> = {
  MONDAY: 'lunes',
  TUESDAY: 'martes',
  WEDNESDAY: 'miércoles',
  THURSDAY: 'jueves',
  FRIDAY: 'viernes',
  SATURDAY: 'sábado',
  SUNDAY: 'domingo',
};

export interface SlotTime {
  id?: string;
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  recess?: boolean;
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function overlaps(a: SlotTime, b: SlotTime): boolean {
  if (a.weekday !== b.weekday || a.recess || b.recess) return false;
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
}

/** The first slot of `others` (other than the candidate itself) that clashes with it. */
export function firstClash<T extends SlotTime>(candidate: SlotTime, others: T[]): T | undefined {
  return others.find((o) => o.id !== candidate.id && overlaps(candidate, o));
}

/** "el jueves de 12:30 a 13:15" */
export function describeTime(slot: SlotTime): string {
  return `el ${DAY_NAMES[slot.weekday]} de ${slot.startTime} a ${slot.endTime}`;
}

export function isValidRange(startTime: string, endTime: string): boolean {
  const re = /^([01]\d|2[0-3]):[0-5]\d$/;
  return re.test(startTime) && re.test(endTime) && toMinutes(startTime) < toMinutes(endTime);
}
