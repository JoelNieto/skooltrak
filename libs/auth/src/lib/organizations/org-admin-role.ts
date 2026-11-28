import type { Prisma } from '@generated/prisma';

/**
 * Create the per-organization `ORG_ADMIN` role holding every permission.
 *
 * Shared by the legacy self-service path (`AuthService.createSchoolWithOrganization`)
 * and the invitation path (IAM-001), so both produce an identical admin role.
 */
export async function createOrgAdminRole(tx: Prisma.TransactionClient, organizationId: string) {
  const allPermissions = await tx.permission.findMany({ select: { id: true } });
  return tx.role.create({
    data: {
      name: 'ORG_ADMIN',
      description: 'Organization Administrator',
      organizationId,
      permissions: { connect: allPermissions.map((p) => ({ id: p.id })) },
    },
    include: { permissions: true },
  });
}

/** URL-safe slug from a name (same rules as the legacy onboarding path). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
