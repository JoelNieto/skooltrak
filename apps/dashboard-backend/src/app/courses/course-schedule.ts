import { WeekDay } from '@generated/prisma';

/**
 * ACA-001 BR .9: the schedule text of a course for one class group, from its non-recess weekly slots.
 * - Days abbreviated in week order: "Lun, Mié, Vie". Monday to Friday (with or without the weekend)
 *   is "Todos los días".
 * - The place is the most frequent non-empty location; "Virtual" when every slot is remote.
 * - `times` is the shared "7:00–7:45" when every slot has the same range (course page header).
 */

const ORDER: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const SHORT: Record<WeekDay, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mié',
  THURSDAY: 'Jue',
  FRIDAY: 'Vie',
  SATURDAY: 'Sáb',
  SUNDAY: 'Dom',
};
const WEEKDAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export interface ScheduleSlot {
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  location: string;
  remote: boolean;
  recess: boolean;
}

export interface CourseSchedule {
  days: string;
  place: string | null;
  times: string | null;
}

const clock = (hhmm: string) => hhmm.replace(/^0(\d)/, '$1');

export function courseSchedule(slots: ScheduleSlot[]): CourseSchedule | null {
  const classes = slots.filter((s) => !s.recess);
  if (!classes.length) return null;

  const days = ORDER.filter((d) => classes.some((s) => s.weekday === d));
  const everyWeekday = WEEKDAYS.every((d) => days.includes(d));
  const dayText = everyWeekday ? 'Todos los días' : days.map((d) => SHORT[d]).join(', ');

  let place: string | null = null;
  if (classes.every((s) => s.remote)) {
    place = 'Virtual';
  } else {
    const counts = new Map<string, number>();
    for (const s of classes) {
      const location = s.location.trim();
      if (location) counts.set(location, (counts.get(location) ?? 0) + 1);
    }
    // Most frequent; ties go to the first in week order.
    for (const [location, count] of counts) if (!place || count > (counts.get(place) ?? 0)) place = location;
  }

  const ranges = new Set(classes.map((s) => `${clock(s.startTime)}–${clock(s.endTime)}`));
  const times = ranges.size === 1 ? [...ranges][0] : null;

  return { days: dayText, place, times };
}

/** The card's line: "Lun, Mié, Vie · Aula 7". */
export function scheduleText(schedule: CourseSchedule | null): string | null {
  if (!schedule) return null;
  return schedule.place ? `${schedule.days} · ${schedule.place}` : schedule.days;
}
