import { PlanSettingsInput } from './dto/plan-settings.input';

/** The scalar settings to write, leaving out the fields the input leaves out. */
export function settingsScalars(input: PlanSettingsInput) {
  const data: { gradeMetricId?: string | null } = {};
  if (input.gradeMetricId !== undefined) data.gradeMetricId = input.gradeMetricId || null;
  return data;
}
