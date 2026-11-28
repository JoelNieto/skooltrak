import { describe, expect, it } from 'vitest';
import {
  clashingPairs,
  firstClash,
  formatDuration,
  freeSlots,
  hourWindow,
  layoutDay,
  minutesBy,
  sharedBreaks,
  TimeRange,
  WeekdayKey,
} from './schedule-grid';

const s = (weekday: WeekdayKey, startTime: string, endTime: string, id = `${weekday}-${startTime}`): TimeRange => ({
  id,
  weekday,
  startTime,
  endTime,
});

describe('schedule grid helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(120)).toBe('2 h');
  });

  it('finds clashes but not touching ranges', () => {
    const slots = [s('MONDAY', '07:00', '07:45'), s('MONDAY', '07:45', '08:30')];
    expect(clashingPairs(slots)).toHaveLength(0);
    expect(firstClash(s('MONDAY', '07:30', '08:00', 'new'), slots)?.startTime).toBe('07:00');
    expect(firstClash(s('TUESDAY', '07:30', '08:00', 'new'), slots)).toBeUndefined();
  });

  it('widens the hour window to fit every slot', () => {
    expect(hourWindow([])).toEqual({ start: 7, end: 14 });
    expect(hourWindow([s('MONDAY', '06:30', '07:15'), s('MONDAY', '15:10', '15:50')])).toEqual({ start: 6, end: 16 });
  });

  it('lays out a day, splitting overlaps into lanes', () => {
    const placed = layoutDay(
      [s('MONDAY', '07:00', '08:00', 'a'), s('MONDAY', '07:30', '08:30', 'b'), s('MONDAY', '09:00', '09:45', 'c')],
      { start: 7, end: 14 },
      1.6,
    );
    const byId = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect(byId['a']).toMatchObject({ top: 0, height: 96, left: 0, width: 50 });
    expect(byId['b']).toMatchObject({ top: 48, left: 50, width: 50 });
    expect(byId['c']).toMatchObject({ top: 192, left: 0, width: 100 });
  });

  it('infers breaks shared by every day', () => {
    const week = (['MONDAY', 'TUESDAY'] as const).flatMap((d) => [
      s(d, '07:00', '09:15'),
      s(d, '09:35', '11:50'),
      s(d, '12:30', '13:15'),
    ]);
    expect(sharedBreaks(week)).toEqual([
      { startTime: '09:15', endTime: '09:35' },
      { startTime: '11:50', endTime: '12:30' },
    ]);
    // A class at 09:00–10:00 on Wednesday fills the morning break; a short day keeps lunch.
    expect(sharedBreaks([...week, s('WEDNESDAY', '09:00', '10:00')])).toEqual([
      { startTime: '11:50', endTime: '12:30' },
    ]);
    expect(sharedBreaks([s('MONDAY', '07:00', '08:00'), s('TUESDAY', '07:00', '08:00')])).toEqual([]);
  });

  it('lists periods used on one day and empty on another', () => {
    const days: WeekdayKey[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const slots = [s('MONDAY', '07:00', '07:45'), s('MONDAY', '12:30', '13:15'), s('FRIDAY', '07:00', '07:45')];
    expect(freeSlots(slots, days)).toEqual([{ weekday: 'FRIDAY', startTime: '12:30', endTime: '13:15' }]);
  });

  it('adds up minutes per key', () => {
    const totals = minutesBy(
      [
        { ...s('MONDAY', '07:00', '08:30'), course: 'MAT' },
        { ...s('TUESDAY', '07:00', '07:45'), course: 'MAT' },
        { ...s('TUESDAY', '09:15', '09:35'), course: 'X', recess: true },
      ],
      (x) => x.course,
    );
    expect([...totals]).toEqual([['MAT', 135]]);
  });
});
