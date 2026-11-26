import { calendarYear, installmentDescription, installments, scheduleError, scheduleLabel } from './fee-schedule';

/** FR-FIN-001.4 / .6: fee calendars resolved per academic year. */
describe('fee schedule', () => {
  const monthly = (startMonth: number, endMonth: number, dueDay = 5) =>
    ({ schedule: 'MONTHLY', dueMonth: null, startMonth, endMonth, dueDay }) as const;

  it('keeps a Mar–Dec school year in one calendar year', () => {
    const list = installments(monthly(3, 12), 2027, 3);
    expect(list).toHaveLength(10);
    expect(list[0]).toEqual({ index: 1, month: 3, dueDate: '2027-03-05' });
    expect(list[9]).toEqual({ index: 10, month: 12, dueDate: '2027-12-05' });
  });

  it('rolls an Aug–Jun school year into the next calendar year', () => {
    const list = installments(monthly(8, 6, 10), 2026, 8);
    expect(list.map((i) => i.dueDate)).toEqual([
      '2026-08-10', '2026-09-10', '2026-10-10', '2026-11-10', '2026-12-10',
      '2027-01-10', '2027-02-10', '2027-03-10', '2027-04-10', '2027-05-10', '2027-06-10',
    ]);
    expect(list.map((i) => i.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('clamps the due day to the end of the month', () => {
    expect(installments(monthly(1, 4, 31), 2028, 1).map((i) => i.dueDate)).toEqual([
      '2028-01-31', '2028-02-29', '2028-03-31', '2028-04-30',
    ]);
  });

  it('resolves a one-time fee in the school year', () => {
    const fee = { schedule: 'ONE_TIME', dueMonth: 2, startMonth: null, endMonth: null, dueDay: 15 } as const;
    // A March school: February is the end of the year, so it falls in the next calendar year.
    expect(installments(fee, 2027, 3)).toEqual([{ index: 1, month: 2, dueDate: '2028-02-15' }]);
    expect(installments(fee, 2027, 1)).toEqual([{ index: 1, month: 2, dueDate: '2027-02-15' }]);
    expect(calendarYear(2027, 2, 3)).toBe(2028);
  });

  it('rejects incomplete calendars', () => {
    expect(scheduleError({ schedule: 'ONE_TIME', dueMonth: null, startMonth: null, endMonth: null, dueDay: 5 })).toBe('Indica el mes de vencimiento');
    expect(scheduleError({ schedule: 'MONTHLY', dueMonth: null, startMonth: 3, endMonth: null, dueDay: 5 })).toBe('Indica el mes inicial y el final');
    expect(scheduleError(monthly(3, 12, 0))).toBe('El día de vencimiento debe estar entre 1 y 31');
    expect(() => installments(monthly(3, 13), 2027, 3)).toThrow();
  });

  it('names installments and calendars in Spanish', () => {
    const [march] = installments(monthly(3, 5), 2027, 3);
    expect(installmentDescription('Mensualidad', 'MONTHLY', march)).toBe('Mensualidad — marzo 2027');
    expect(installmentDescription('Matrícula', 'ONE_TIME', march)).toBe('Matrícula');
    expect(scheduleLabel(monthly(3, 5))).toBe('Mensual · mar–may · día 5');
    expect(scheduleLabel({ schedule: 'ONE_TIME', dueMonth: 2, startMonth: null, endMonth: null, dueDay: 15 })).toBe('Único · 15 feb');
  });
});
