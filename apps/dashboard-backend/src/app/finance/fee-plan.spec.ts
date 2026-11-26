import { feesForPlan } from './fee-plan';

/** BR-FIN-001.4: degree items add up; a study plan's assignment of the same item overrides it. */
describe('feesForPlan', () => {
  const assignments = [
    { feeItemId: 'matricula', degreeId: 'premedia', studyPlanId: null, amountOverride: null, itemAmount: 15_000 },
    { feeItemId: 'mensualidad', degreeId: 'premedia', studyPlanId: null, amountOverride: null, itemAmount: 28_500 },
    { feeItemId: 'mensualidad', degreeId: null, studyPlanId: 'septimo', amountOverride: 25_000, itemAmount: 28_500 },
    { feeItemId: 'laboratorio', degreeId: null, studyPlanId: 'octavo', amountOverride: null, itemAmount: 4_000 },
    { feeItemId: 'transporte', degreeId: 'media', studyPlanId: null, amountOverride: null, itemAmount: 3_000 },
  ];

  it("applies the degree's items and lets the plan override the same item", () => {
    expect(feesForPlan(assignments, { id: 'septimo', degreeId: 'premedia' })).toEqual([
      { feeItemId: 'matricula', amount: 15_000, via: 'DEGREE' },
      { feeItemId: 'mensualidad', amount: 25_000, via: 'STUDY_PLAN' },
    ]);
  });

  it("adds the plan's own items to the degree's", () => {
    expect(feesForPlan(assignments, { id: 'octavo', degreeId: 'premedia' })).toEqual([
      { feeItemId: 'matricula', amount: 15_000, via: 'DEGREE' },
      { feeItemId: 'mensualidad', amount: 28_500, via: 'DEGREE' },
      { feeItemId: 'laboratorio', amount: 4_000, via: 'STUDY_PLAN' },
    ]);
  });

  it('ignores other degrees and plans', () => {
    expect(feesForPlan(assignments, { id: 'decimo', degreeId: 'otro' })).toEqual([]);
  });
});
