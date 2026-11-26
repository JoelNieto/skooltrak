import { AuthUserContext, Perm } from '@/auth';
import { ForbiddenException } from '@nestjs/common';
import { assertSchoolInOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';

export const FINANCE_DENIED = 'No tienes acceso a las finanzas de esta organización';
export const ACCOUNT_DENIED = 'No tienes acceso a esta cuenta';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/**
 * School finance staff: admins, or a staff role holding VIEW_FINANCIALS. Parents and students hold
 * VIEW_FINANCIALS for their own accounts only, so they are never staff.
 */
export function isFinanceStaff(user: AuthUserContext | undefined): boolean {
  const role = user?.role?.toUpperCase() ?? '';
  if (ADMIN_ROLES.has(role)) return true;
  if (role === 'PARENT' || role === 'STUDENT') return false;
  return !!user?.permissions?.includes(Perm.VIEW_FINANCIALS);
}

/** Finance staff who may write: admins, or staff holding MANAGE_FINANCIALS. */
export function isFinanceManager(user: AuthUserContext | undefined): boolean {
  const role = user?.role?.toUpperCase() ?? '';
  if (ADMIN_ROLES.has(role)) return true;
  return isFinanceStaff(user) && !!user?.permissions?.includes(Perm.MANAGE_FINANCIALS);
}

/** 403 unless the caller is finance staff (a manager when `manage`) of the school's organization. */
export async function assertFinanceStaffOfSchool(
  prisma: PrismaService,
  user: AuthUserContext | undefined,
  schoolId: string | undefined,
  manage = false,
): Promise<string> {
  if (!(manage ? isFinanceManager(user) : isFinanceStaff(user))) throw new ForbiddenException(FINANCE_DENIED);
  return assertSchoolInOrganization(prisma, user, schoolId);
}
