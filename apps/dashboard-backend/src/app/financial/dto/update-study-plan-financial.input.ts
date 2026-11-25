import { IsString } from 'class-validator';
import { PlanSettingsInput } from '../../study-plans/dto/plan-settings.input';

export { EnrollmentCostInput } from '../../study-plans/dto/plan-settings.input';

/** A plan's financial overrides; `gradeMetricId` is ignored here. */
export class UpdateStudyPlanFinancialInput extends PlanSettingsInput {
  @IsString()
  studyPlanId: string;
}
