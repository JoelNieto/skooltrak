import { suggestedPlanName, suggestedPlanShortName, tuitionMonthsInRange } from './study-plan-setup';

describe('tuitionMonthsInRange', () => {
  it('lists a range inside one calendar year', () => {
    expect(tuitionMonthsInRange(3, 12)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('wraps over New Year when the end is before the start', () => {
    expect(tuitionMonthsInRange(8, 5)).toEqual([8, 9, 10, 11, 12, 1, 2, 3, 4, 5]);
  });

  it('gives a single month when start and end match', () => {
    expect(tuitionMonthsInRange(4, 4)).toEqual([4]);
  });

  it('gives no months when a bound is missing or invalid', () => {
    expect(tuitionMonthsInRange(null, 5)).toEqual([]);
    expect(tuitionMonthsInRange(3, undefined)).toEqual([]);
    expect(tuitionMonthsInRange(0, 5)).toEqual([]);
    expect(tuitionMonthsInRange(3, 13)).toEqual([]);
    expect(tuitionMonthsInRange(2.5, 5)).toEqual([]);
  });
});

describe('suggested plan names', () => {
  it('prefixes the grade ordinal to the degree names', () => {
    expect(suggestedPlanName(3, 'Primaria')).toBe('3° Primaria');
    expect(suggestedPlanShortName(10, 'M')).toBe('10° M');
  });
});
