import { BadRequestException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { assertNoOverlap, assertPeriodDates, assertPeriodForSchool, pickSchoolPeriods } from './school-periods';

const d = (day: string) => new Date(`${day}T12:00:00.000Z`);
const global = (id: string, year: number, start: string, end: string) => ({
  id,
  year,
  name: id,
  shortName: id,
  startDate: d(start),
  endDate: d(end),
  schoolId: null as string | null,
});
const own = (id: string, year: number, start: string, end: string, schoolId = 'SCH1') => ({
  ...global(id, year, start, end),
  schoolId,
});

const rows = [
  global('g26-1', 2026, '2026-03-01', '2026-05-31'),
  global('g26-2', 2026, '2026-06-01', '2026-08-31'),
  global('g27-1', 2027, '2027-03-01', '2027-05-31'),
  // SCH1 runs an American year in 2026: Aug 2026 – Jun 2027, in quarters.
  own('q2', 2026, '2026-11-01', '2027-01-15'),
  own('q1', 2026, '2026-08-17', '2026-10-31'),
  own('other', 2026, '2026-08-01', '2026-12-31', 'SCH9'),
];

describe('pickSchoolPeriods', () => {
  it("uses the school's own periods for a year where it has them, the global ones otherwise", () => {
    const periods = pickSchoolPeriods(rows, 'SCH1');
    expect(periods.map((p) => p.id)).toEqual(['q1', 'q2', 'g27-1']);
    expect(periods.map((p) => p.custom)).toEqual([true, true, false]);
  });

  it("never returns another school's periods", () => {
    expect(pickSchoolPeriods(rows, 'SCH2').map((p) => p.id)).toEqual(['g26-1', 'g26-2', 'g27-1']);
    expect(pickSchoolPeriods(rows, null).map((p) => p.id)).toEqual(['g26-1', 'g26-2', 'g27-1']);
  });
});

describe('assertPeriodForSchool', () => {
  const prisma = (period: { year: number; schoolId: string | null } | null, ownCount = 0) =>
    ({ period: { findUnique: jest.fn(async () => period), count: jest.fn(async () => ownCount) } }) as never;

  it('accepts its own period and a global one of a year on global periods', async () => {
    await expect(assertPeriodForSchool(prisma({ year: 2026, schoolId: 'SCH1' }), 'q1', 'SCH1')).resolves.toBeUndefined();
    await expect(assertPeriodForSchool(prisma({ year: 2026, schoolId: null }), 'g26-1', 'SCH1')).resolves.toBeUndefined();
  });

  it("rejects another school's period, a global one of a year on own periods, and unknown ids", async () => {
    await expect(assertPeriodForSchool(prisma({ year: 2026, schoolId: 'SCH9' }), 'x', 'SCH1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(assertPeriodForSchool(prisma({ year: 2026, schoolId: null }, 2), 'g26-1', 'SCH1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(assertPeriodForSchool(prisma(null), 'nope', 'SCH1')).rejects.toThrow(BadRequestException);
  });
});

describe('date rules', () => {
  it('rejects an end before the start', () => {
    expect(() => assertPeriodDates(d('2026-05-01'), d('2026-04-01'))).toThrow(BadRequestException);
    expect(() => assertPeriodDates(d('2026-05-01'), d('2026-05-01'))).not.toThrow();
  });

  it('rejects periods sharing a day, ignoring the period being edited', () => {
    const others = [{ id: 'q1', name: 'Q1', startDate: d('2026-08-17'), endDate: d('2026-10-31') }];
    expect(() => assertNoOverlap({ startDate: d('2026-10-31'), endDate: d('2027-01-15') }, others)).toThrow(
      'El periodo se solapa con Q1',
    );
    expect(() => assertNoOverlap({ startDate: d('2026-11-01'), endDate: d('2027-01-15') }, others)).not.toThrow();
    expect(() => assertNoOverlap({ id: 'q1', startDate: d('2026-08-01'), endDate: d('2026-10-31') }, others)).not.toThrow();
  });
});
