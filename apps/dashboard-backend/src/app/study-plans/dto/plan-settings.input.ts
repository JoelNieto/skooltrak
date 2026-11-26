import { IsOptional, IsString } from 'class-validator';

/**
 * The settings a degree sets for its study plans and a plan may override (study-plans/plan-settings.ts).
 * Leave a field out to keep it; on a plan, null inherits the degree's. Fees live in the finance
 * catalog (FIN-001), not here.
 */
export class PlanSettingsInput {
  @IsOptional()
  @IsString()
  gradeMetricId?: string | null;
}
