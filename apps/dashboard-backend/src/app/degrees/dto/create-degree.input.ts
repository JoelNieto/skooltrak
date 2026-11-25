import { IsString } from 'class-validator';
import { PlanSettingsInput } from '../../study-plans/dto/plan-settings.input';

/** A degree (level) and the settings its study plans inherit. */
export class CreateDegreeInput extends PlanSettingsInput {
  @IsString()
  name: string;

  @IsString()
  shortName: string;

  @IsString()
  schoolId: string;
}
