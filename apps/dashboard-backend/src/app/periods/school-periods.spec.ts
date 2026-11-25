import { BadRequestException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { applyPeriodOverride, assertPeriodDates, loadSchoolPeriods } from './school-periods';

const d = (day: string) => new Date(`${day}T12:00:00.000Z`);
const t1 = { id: 'p1', year: 2026, name: 'Primer trimestre', shortName: 'T1', startDate: d('2026-03-01'), endDate: d('2026-05-31') };
const t2 = { id: 'p2', year: 2026, name: 'Segundo trimestre', shortName: 'T2', startDate: d('2026-06-01'), endDate: d('2026-08-31') };
const none = { name: null, shortName: null, startDate: null, endDate: null };

describe('applyPeriodOverride', () => {
  it('uses the global values without an override', () => {
    expect(applyPeriodOverride(t1, null)).toEqual({ ...t1, overridden: false });
    expect(applyPeriodOverride(t1, none)).toEqual({ ...t1, overridden: false });
  });

  it('replaces only the overridden fields', () => {
    const p = applyPeriodOverride(t1, { ...none, name: 'Bimestre 1', endDate: d('2026-04-30') });
    expect(p).toEqual({ ...t1, name: 'Bimestre 1', endDate: d('2026-04-30'), overridden: true });
  });
});

describe('loadSchoolPeriods', () => {
  it("applies the school's overrides and orders by effective start date", async () => {
    const findMany = jest.fn(async () => [
      { ...t1, schoolOverrides: [{ ...none, startDate: d('2026-09-01'), endDate: d('2026-11-30') }] },
      { ...t2, schoolOverrides: [] },
    ]);
    const periods = await loadSchoolPeriods({ period: { findMany } } as never, 'SCH1', 2026);
    expect(periods.map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(periods[1]).toMatchObject({ startDate: d('2026-09-01'), overridden: true });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { year: 2026 },
        select: expect.objectContaining({ schoolOverrides: expect.objectContaining({ where: { schoolId: 'SCH1' } }) }),
      }),
    );
  });

  it('without a school, returns the global periods', async () => {
    const findMany = jest.fn(async () => [t2, t1]);
    const periods = await loadSchoolPeriods({ period: { findMany } } as never, undefined, 2026);
    expect(periods.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(periods.every((p) => !p.overridden)).toBe(true);
  });
});

describe('assertPeriodDates', () => {
  it('rejects an end before the start', () => {
    expect(() => assertPeriodDates(d('2026-05-01'), d('2026-04-01'))).toThrow(BadRequestException);
    expect(() => assertPeriodDates(d('2026-05-01'), d('2026-05-01'))).not.toThrow();
  });
});
