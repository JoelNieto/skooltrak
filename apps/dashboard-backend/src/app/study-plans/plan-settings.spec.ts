import { effectiveGradeMetric, withEffectiveMetric } from './plan-settings';

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
