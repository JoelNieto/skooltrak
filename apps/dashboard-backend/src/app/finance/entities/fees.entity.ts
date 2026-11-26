import { FeeKind, FeeSchedule } from '@generated/prisma';
import { ApiProperty } from '@nestjs/swagger';
import { FinanceRef } from './finance.entity';

/** Responses of the fee catalog and charge generation (FIN-001-S02). Amounts in school currency. */

export class FeeItemView {
  id: string;
  name: string;
  @ApiProperty({ enum: FeeKind, enumName: 'FeeKind' })
  kind: FeeKind;
  amount: number;
  @ApiProperty({ enum: FeeSchedule, enumName: 'FeeSchedule' })
  schedule: FeeSchedule;
  dueMonth: number | null;
  startMonth: number | null;
  endMonth: number | null;
  dueDay: number;
  active: boolean;
  /** "Mensual · mar–may · día 5" */
  scheduleLabel: string;
  /** Charges generated from the item; once > 0 its kind and calendar are fixed. */
  chargeCount: number;
}

export class FeeItemList {
  items: FeeItemView[];
  currencyCode: string;
}

export class FeeAssignmentView {
  id: string;
  year: number;
  feeItem: FinanceRef;
  /** Exactly one of degree / studyPlan is set. */
  degree: FinanceRef | null;
  studyPlan: (FinanceRef & { degreeId: string }) | null;
  amountOverride: number | null;
  /** The amount charged: the override or the item's amount. */
  amount: number;
}

export class FeeTargetStudyPlan extends FinanceRef {
  classGroups: FinanceRef[];
}

export class FeeTargetDegree extends FinanceRef {
  studyPlans: FeeTargetStudyPlan[];
}

/** Degrees → study plans → class groups of a school, for assignment and generation pickers. */
export class FeeTargets {
  degrees: FeeTargetDegree[];
  currentYear: number;
  currencyCode: string;
}

export class GenerationItemLine {
  feeItemId: string;
  name: string;
  /** Installments per student. */
  installments: number;
  students: number;
  newCount: number;
  newTotal: number;
}

export class GenerationStudentLine {
  id: string;
  name: string;
  classGroup: string | null;
  newCount: number;
  newTotal: number;
  existingCount: number;
}

/** FR-FIN-001.6 preview: what a generation would create. */
export class GenerationPreview {
  year: number;
  students: number;
  newCount: number;
  newTotal: number;
  /** Charges of the scope already generated, left as they are (BR-FIN-001.5). */
  existingCount: number;
  items: GenerationItemLine[];
  studentLines: GenerationStudentLine[];
  currencyCode: string;
}

export class GenerationResult {
  created: number;
  skipped: number;
}
