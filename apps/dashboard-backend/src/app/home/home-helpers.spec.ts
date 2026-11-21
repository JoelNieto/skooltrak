import { AttendanceStatus, WeekDay } from '@generated/prisma';
import { attendanceRate } from './home-attendance';
import { averageKey, gradeBand, weightedAverages } from './home-grades';
import { pickCurrentPeriod, pickPreviousPeriod } from './home-period';
import { daysBetween, localMidnight, schoolLocalTime } from './home-time';

describe('HOM-001 helpers', () => {
  describe('schoolLocalTime (BR-HOM-001.4)', () => {
    it('uses the school wall clock, not UTC, near midnight', () => {
      // 03:30 UTC on Tuesday 17 Nov is still Monday 16 Nov 22:30 in Panama (UTC−5).
      const local = schoolLocalTime(new Date('2026-11-17T03:30:00Z'), 'America/Panama');

      expect(local).toEqual({
        timezone: 'America/Panama',
        date: '2026-11-16',
        time: '22:30',
        weekday: WeekDay.MONDAY,
        weekStart: '2026-11-16',
        weekEnd: '2026-11-22',
      });
    });

    it('treats Sunday as the last day of the week', () => {
      const local = schoolLocalTime(new Date('2026-11-22T15:00:00Z'), 'America/Panama');

      expect(local.weekday).toBe(WeekDay.SUNDAY);
      expect(local.weekStart).toBe('2026-11-16');
    });

    it('formats midnight as 00:00', () => {
      expect(schoolLocalTime(new Date('2026-11-16T05:00:00Z'), 'America/Panama').time).toBe('00:00');
    });

    it('falls back to UTC for an unknown timezone', () => {
      const local = schoolLocalTime(new Date('2026-11-17T03:30:00Z'), 'Mars/Olympus');

      expect(local.timezone).toBe('UTC');
      expect(local.date).toBe('2026-11-17');
    });
  });

  describe('localMidnight', () => {
    it('is the UTC instant a school-local day starts', () => {
      expect(localMidnight('2026-11-16', 'America/Panama')).toEqual(new Date('2026-11-16T05:00:00Z'));
      expect(localMidnight('2026-11-16', 'Asia/Tokyo')).toEqual(new Date('2026-11-15T15:00:00Z'));
      expect(localMidnight('2026-11-16', 'UTC')).toEqual(new Date('2026-11-16T00:00:00Z'));
    });

    it('falls back to UTC for an unknown timezone', () => {
      expect(localMidnight('2026-11-16', 'Mars/Olympus')).toEqual(new Date('2026-11-16T00:00:00Z'));
    });
  });

  describe('daysBetween', () => {
    it('counts whole days, negative backwards', () => {
      expect(daysBetween('2026-11-16', '2026-11-27')).toBe(11);
      expect(daysBetween('2026-11-16', '2026-11-16')).toBe(0);
      expect(daysBetween('2026-11-16', '2026-11-10')).toBe(-6);
    });
  });

  describe('pickCurrentPeriod (BR-HOM-001.3)', () => {
    const period = (id: string, start: string, end: string) => ({
      id,
      name: id,
      startDate: new Date(`${start}T05:00:00Z`),
      endDate: new Date(`${end}T05:00:00Z`),
    });
    const periods = [period('I', '2026-03-02', '2026-06-05'), period('II', '2026-06-15', '2026-09-11')];

    it('picks the period containing today, including its last day', () => {
      expect(pickCurrentPeriod(periods, '2026-09-11')?.id).toBe('II');
    });

    it('falls back to the most recently ended period', () => {
      expect(pickCurrentPeriod(periods, '2026-06-10')?.id).toBe('I');
      expect(pickCurrentPeriod(periods, '2026-11-16')?.id).toBe('II');
    });

    it('returns null before the first period starts', () => {
      expect(pickCurrentPeriod(periods, '2026-02-01')).toBeNull();
    });
  });

  describe('pickPreviousPeriod', () => {
    const p = (id: string, start: string, end: string) => ({
      id,
      name: id,
      startDate: new Date(`${start}T05:00:00Z`),
      endDate: new Date(`${end}T05:00:00Z`),
    });
    const periods = [p('I', '2026-03-02', '2026-06-05'), p('II', '2026-06-15', '2026-09-11'), p('III', '2026-09-21', '2026-12-04')];

    it('is the period that ended just before the current one started', () => {
      expect(pickPreviousPeriod(periods, periods[2])?.id).toBe('II');
      expect(pickPreviousPeriod(periods, periods[0])).toBeNull();
      expect(pickPreviousPeriod(periods, null)).toBeNull();
    });
  });

  describe('weightedAverages (BR-HOM-001.11)', () => {
    it('averages each bucket first, then weights the buckets (ASM-001 BR .4)', () => {
      // Trabajo diario 40 (4, 4, 4, 4) and Pruebas 60 (2): 2.8, not 3.5 (per score) or 3.6 (plain mean).
      const avgs = weightedAverages([row(4, 40), row(4, 40), row(4, 40), row(4, 40), row(2, 60)]);
      expect(avgs.get(averageKey('s', 'c', 'p'))).toBeCloseTo(2.8);
    });

    const row = (score: number | null, weight: number, courseId = 'c', periodId = 'p', studentId = 's') => ({
      studentId,
      score,
      grade: { courseId, periodId, bucketId: `b-${weight}`, bucket: { weight } },
    });

    it('weights scores by bucket and skips unscored rows', () => {
      const avgs = weightedAverages([row(2, 3), row(3.6, 1), row(null, 10)]);
      expect(avgs.get(averageKey('s', 'c', 'p'))).toBeCloseTo(2.4);
    });

    it('has no average without a scored grade, and keeps courses and periods apart', () => {
      const avgs = weightedAverages([row(null, 1), row(4, 1, 'c2'), row(3, 1, 'c2', 'p0')]);
      expect(avgs.has(averageKey('s', 'c', 'p'))).toBe(false);
      expect(avgs.get(averageKey('s', 'c2', 'p'))).toBe(4);
      expect(avgs.get(averageKey('s', 'c2', 'p0'))).toBe(3);
    });
  });

  describe('gradeBand (BR-HOM-001.1)', () => {
    const scale = { maximum: 5, minimumApproval: 3, minimumExcellence: 4.5 };

    it.each([
      [4.5, 'EXCELLENT'],
      [4.49, 'PASSING'],
      [3, 'PASSING'],
      [2.99, 'BELOW'],
    ])('%s → %s', (score, band) => {
      expect(gradeBand(score, scale)).toBe(band);
    });

    it('has no band without a score or a scale', () => {
      expect(gradeBand(null, scale)).toBeNull();
      expect(gradeBand(4, null)).toBeNull();
    });
  });

  describe('attendanceRate (BR-HOM-001.5)', () => {
    it('counts LATE as present and leaves EXCUSED and SICK_LEAVE out', () => {
      const rate = attendanceRate({
        [AttendanceStatus.PRESENT]: 80,
        [AttendanceStatus.LATE]: 2,
        [AttendanceStatus.ABSENT]: 5,
        [AttendanceStatus.EXCUSED]: 2,
        [AttendanceStatus.SICK_LEAVE]: 1,
      });

      expect(rate).toBeCloseTo(82 / 87);
    });

    it('is null when nothing counts', () => {
      expect(attendanceRate({})).toBeNull();
      expect(attendanceRate({ [AttendanceStatus.EXCUSED]: 3 })).toBeNull();
    });
  });
});
