export class RegenerateStudyPlanChargesInput {
  studentId: string;

  /** When true, removes existing non-paid study-plan charges before regenerating. */
  force?: boolean;
}
