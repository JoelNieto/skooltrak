import { courseSchedule, ScheduleSlot, scheduleText } from './course-schedule';

/** ACA-001 BR .9 — schedule text. */
const slot = (weekday: ScheduleSlot['weekday'], over: Partial<ScheduleSlot> = {}): ScheduleSlot => ({
  weekday,
  startTime: '07:00',
  endTime: '07:45',
  location: 'Aula 7',
  remote: false,
  recess: false,
  ...over,
});

describe('courseSchedule', () => {
  it('lists the days in week order with the place and shared times', () => {
    const s = courseSchedule([slot('FRIDAY'), slot('MONDAY'), slot('WEDNESDAY')]);
    expect(s).toEqual({ days: 'Lun, Mié, Vie', place: 'Aula 7', times: '7:00–7:45' });
    expect(scheduleText(s)).toBe('Lun, Mié, Vie · Aula 7');
  });

  it('says "Todos los días" from Monday to Friday, weekend or not', () => {
    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
    expect(courseSchedule(weekdays.map((d) => slot(d)))?.days).toBe('Todos los días');
    expect(
      courseSchedule([...weekdays, 'SATURDAY', 'SUNDAY'].map((d) => slot(d as ScheduleSlot['weekday'])))?.days,
    ).toBe('Todos los días');
  });

  it('takes the most frequent location, "Virtual" when all are remote, and no shared times when they differ', () => {
    const s = courseSchedule([
      slot('MONDAY', { location: 'Lab' }),
      slot('TUESDAY', { location: 'Aula 2', startTime: '09:00', endTime: '09:45' }),
      slot('THURSDAY', { location: 'Aula 2' }),
    ]);
    expect([s?.place, s?.times]).toEqual(['Aula 2', null]);
    expect(courseSchedule([slot('MONDAY', { remote: true, location: '' })])?.place).toBe('Virtual');
    expect(scheduleText(courseSchedule([slot('MONDAY', { location: '' })]))).toBe('Lun');
  });

  it('skips recess, and has no text without classes', () => {
    expect(courseSchedule([slot('MONDAY', { recess: true })])).toBeNull();
    expect(scheduleText(null)).toBeNull();
  });
});
