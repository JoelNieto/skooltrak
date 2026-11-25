import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PlanSettingsInput } from './plan-settings.input';

/** A study plan; the settings it does not set are inherited from its degree. */
export class CreateStudyPlanInput extends PlanSettingsInput {
  @IsString()
  name: string;

  @IsString()
  shortName: string;

  @IsInt()
  @Min(0)
  level: number;

  @IsString()
  degreeId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  schoolId: string;
}
