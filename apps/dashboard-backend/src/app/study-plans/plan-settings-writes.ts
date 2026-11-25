import { AuthUserContext, Perm } from '@/auth';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FINANCE_DENIED, isFinanceStaff } from '../financial/financial.controller';
import { EnrollmentCostInput, PlanSettingsInput } from './dto/plan-settings.input';

export const TUITION_PERIOD_INVALID = 'El periodo de colegiatura necesita un mes de inicio y uno de fin';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/** Whether the input writes a financial setting (tuition or enrollment costs). */
export function touchesFinancials(input: PlanSettingsInput): boolean {
  return (
    input.monthlyTuitionAmount !== undefined ||
    input.tuitionStartMonth !== undefined ||
    input.tuitionEndMonth !== undefined ||
    input.enrollmentCosts !== undefined
  );
}

/**
 * Financial settings of a degree or plan are written by finance managers only: the same rule as
 * POST /financial/study-plan-config (finance staff holding MANAGE_FINANCIALS, or an admin).
 */
export function assertCanWriteSettings(user: AuthUserContext | undefined, input: PlanSettingsInput): void {
  if (!touchesFinancials(input)) return;
  const role = user?.role?.toUpperCase() ?? '';
  const allowed =
    ADMIN_ROLES.has(role) || (isFinanceStaff(user) && !!user?.permissions?.includes(Perm.MANAGE_FINANCIALS));
  if (!allowed) throw new ForbiddenException(FINANCE_DENIED);
}

/**
 * The scalar settings to write, leaving out the fields the input leaves out. The tuition period
 * is written as a pair: both months, or both cleared.
 */
export function settingsScalars(input: PlanSettingsInput) {
  const data: {
    gradeMetricId?: string | null;
    monthlyTuitionAmount?: number | null;
    tuitionStartMonth?: number | null;
    tuitionEndMonth?: number | null;
  } = {};
  if (input.gradeMetricId !== undefined) data.gradeMetricId = input.gradeMetricId || null;
  if (input.monthlyTuitionAmount !== undefined) data.monthlyTuitionAmount = input.monthlyTuitionAmount;
  if (input.tuitionStartMonth !== undefined || input.tuitionEndMonth !== undefined) {
    const start = input.tuitionStartMonth ?? null;
    const end = input.tuitionEndMonth ?? null;
    if ((start === null) !== (end === null)) throw new BadRequestException(TUITION_PERIOD_INVALID);
    data.tuitionStartMonth = start;
    data.tuitionEndMonth = end;
  }
  return data;
}

/** Enrollment cost rows in the given order, without blank names. */
export function costRows(costs: EnrollmentCostInput[]) {
  return costs
    .filter((c) => c.name?.trim())
    .map((c, i) => ({ name: c.name.trim(), amount: c.amount, order: i }));
}
