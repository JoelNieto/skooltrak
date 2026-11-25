import { Perm } from '@/auth';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { assertCanWriteSettings, costRows, settingsScalars, touchesFinancials } from './plan-settings-writes';

describe('assertCanWriteSettings', () => {
  const staff = (permissions: string[]) => ({ userId: 'u', role: 'TEACHER', permissions }) as never;

  it('lets anyone through when no financial field is written', () => {
    expect(() => assertCanWriteSettings(staff([]), { gradeMetricId: 'm' })).not.toThrow();
  });

  it('lets admins and finance managers write financial fields', () => {
    expect(() => assertCanWriteSettings({ userId: 'u', role: 'ADMIN' } as never, { monthlyTuitionAmount: 1 })).not.toThrow();
    expect(() =>
      assertCanWriteSettings(staff([Perm.VIEW_FINANCIALS, Perm.MANAGE_FINANCIALS]), { enrollmentCosts: [] }),
    ).not.toThrow();
  });

  it('refuses financial fields to staff without MANAGE_FINANCIALS, and to parents', () => {
    expect(() => assertCanWriteSettings(staff([Perm.VIEW_FINANCIALS]), { tuitionStartMonth: 3 })).toThrow(
      ForbiddenException,
    );
    expect(() =>
      assertCanWriteSettings({ userId: 'u', role: 'PARENT', permissions: [Perm.MANAGE_FINANCIALS] } as never, {
        monthlyTuitionAmount: null,
      }),
    ).toThrow(ForbiddenException);
  });
});

describe('settingsScalars', () => {
  it('writes only the fields the input sets', () => {
    expect(settingsScalars({})).toEqual({});
    expect(touchesFinancials({ gradeMetricId: 'm' })).toBe(false);
    expect(settingsScalars({ gradeMetricId: '', monthlyTuitionAmount: null })).toEqual({
      gradeMetricId: null,
      monthlyTuitionAmount: null,
    });
  });

  it('writes the tuition period as a pair', () => {
    expect(settingsScalars({ tuitionStartMonth: 8, tuitionEndMonth: 5 })).toEqual({
      tuitionStartMonth: 8,
      tuitionEndMonth: 5,
    });
    expect(settingsScalars({ tuitionStartMonth: null, tuitionEndMonth: null })).toEqual({
      tuitionStartMonth: null,
      tuitionEndMonth: null,
    });
    expect(() => settingsScalars({ tuitionStartMonth: 8 })).toThrow(BadRequestException);
    expect(() => settingsScalars({ tuitionStartMonth: null, tuitionEndMonth: 5 })).toThrow(BadRequestException);
  });
});

describe('costRows', () => {
  it('drops blank names and renumbers the order', () => {
    expect(
      costRows([
        { name: ' Matrícula ', amount: 50, order: 7 },
        { name: '  ', amount: 1 },
        { name: 'Seguro', amount: 10 },
      ]),
    ).toEqual([
      { name: 'Matrícula', amount: 50, order: 0 },
      { name: 'Seguro', amount: 10, order: 1 },
    ]);
  });
});
