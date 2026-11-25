import { Prisma } from '@generated/prisma';
import { effectiveFinancials, effectiveGradeMetric, withEffectiveMetric } from './plan-settings';

const dec = (n: number) => new Prisma.Decimal(n);
const none = { monthlyTuitionAmount: null, tuitionStartMonth: null, tuitionEndMonth: null, enrollmentCosts: [] };

describe('effectiveGradeMetric', () => {
  it("prefers the plan's metric over the degree's", () => {
    expect(effectiveGradeMetric({ gradeMetric: { id: 'plan' }, degree: { gradeMetric: { id: 'degree' } } })).toEqual({
      id: 'plan',
    });
  });

  it("falls back to the degree's metric, then to null", () => {
    expect(effectiveGradeMetric({ gradeMetric: null, degree: { gradeMetric: { id: 'degree' } } })).toEqual({
      id: 'degree',
    });
    expect(effectiveGradeMetric({ gradeMetric: null, degree: { gradeMetric: null } })).toBeNull();
    expect(effectiveGradeMetric(null)).toBeNull();
  });

  it('replaces gradeMetric for responses', () => {
    const plan = { id: 'p', gradeMetric: null, degree: { gradeMetric: { id: 'degree' } } };
    expect(withEffectiveMetric(plan).gradeMetric).toEqual({ id: 'degree' });
  });
});

describe('effectiveFinancials', () => {
  it('inherits every setting from the degree when the plan sets none', () => {
    const degree = {
      monthlyTuitionAmount: dec(100),
      tuitionStartMonth: 3,
      tuitionEndMonth: 5,
      enrollmentCosts: [{ name: 'Matrícula', amount: dec(50), order: 0 }],
    };
    const result = effectiveFinancials({ ...none, degree });
    expect(result.monthlyTuitionAmount).toEqual(dec(100));
    expect(result.tuitionMonths).toEqual([3, 4, 5]);
    expect(result.enrollmentCosts).toBe(degree.enrollmentCosts);
  });

  it('overrides each setting the plan sets, independently', () => {
    const result = effectiveFinancials({
      monthlyTuitionAmount: dec(80),
      tuitionStartMonth: 11,
      tuitionEndMonth: 1,
      enrollmentCosts: [],
      degree: { ...none, monthlyTuitionAmount: dec(100), enrollmentCosts: [{ name: 'X', amount: dec(1), order: 0 }] },
    });
    expect(result.monthlyTuitionAmount).toEqual(dec(80));
    expect(result.tuitionMonths).toEqual([11, 12, 1]);
    expect(result.enrollmentCosts.map((c) => c.name)).toEqual(['X']);
  });

  it('bills nothing without a period', () => {
    expect(effectiveFinancials({ ...none, degree: null }).tuitionMonths).toEqual([]);
  });
});
