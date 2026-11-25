import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class EnrollmentCostInput {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

/**
 * The settings a degree sets for its study plans and a plan may override (study-plans/plan-settings.ts).
 * Leave a field out to keep it; on a plan, null (or an empty cost list) inherits the degree's.
 * Writing a financial field needs MANAGE_FINANCIALS.
 */
export class PlanSettingsInput {
  @IsOptional()
  @IsString()
  gradeMetricId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyTuitionAmount?: number | null;

  /** First billed month, 1-12. Set with `tuitionEndMonth`, or clear both. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  tuitionStartMonth?: number | null;

  /** Last billed month, 1-12; before the start it wraps over New Year (8 → 5 is Aug..May). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  tuitionEndMonth?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnrollmentCostInput)
  enrollmentCosts?: EnrollmentCostInput[];
}
