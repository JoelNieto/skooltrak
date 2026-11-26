/**
 * Which fee items apply to a study plan in a year, and for how much (FR-FIN-001.5, BR-FIN-001.4).
 * Pure: the generation service feeds it the year's assignments.
 *
 * - Items assigned to the plan's degree apply to every plan of the degree.
 * - An item assigned to the plan itself replaces the degree's assignment of the same item (its
 *   amount wins); other items add up.
 * - Amounts are in cents; an assignment without an override uses the item's amount.
 */

export interface PlanAssignment {
  feeItemId: string;
  degreeId: string | null;
  studyPlanId: string | null;
  /** Cents, or null for the item's amount. */
  amountOverride: number | null;
  /** The item's amount in cents. */
  itemAmount: number;
}

export interface AppliedFee {
  feeItemId: string;
  /** Cents. */
  amount: number;
  /** Where the amount comes from. */
  via: 'DEGREE' | 'STUDY_PLAN';
}

export function feesForPlan(assignments: PlanAssignment[], plan: { id: string; degreeId: string }): AppliedFee[] {
  const byItem = new Map<string, AppliedFee>();
  for (const a of assignments) {
    if (a.degreeId !== plan.degreeId || a.studyPlanId) continue;
    byItem.set(a.feeItemId, { feeItemId: a.feeItemId, amount: a.amountOverride ?? a.itemAmount, via: 'DEGREE' });
  }
  for (const a of assignments) {
    if (a.studyPlanId !== plan.id) continue;
    byItem.set(a.feeItemId, { feeItemId: a.feeItemId, amount: a.amountOverride ?? a.itemAmount, via: 'STUDY_PLAN' });
  }
  return [...byItem.values()];
}
