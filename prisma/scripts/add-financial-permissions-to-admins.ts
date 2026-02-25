/**
 * Add VIEW_FINANCIALS and MANAGE_FINANCIALS to all admin roles
 * (ORG_ADMIN, SYSADMIN, ADMIN).
 *
 * Run with: bun run prisma/scripts/add-financial-permissions-to-admins.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

const ADMIN_ROLE_NAMES = ['ORG_ADMIN', 'SYSADMIN', 'ADMIN'];

const FINANCIAL_PERMISSIONS: { descriptiveId: string; description: string }[] = [
  { descriptiveId: 'VIEW_FINANCIALS', description: 'View financial balance and payment history' },
  { descriptiveId: 'MANAGE_FINANCIALS', description: 'Create, update, and delete charges and payments' },
];

async function main() {
  // 1. Ensure financial permissions exist (upsert)
  const permIds: string[] = [];
  for (const { descriptiveId, description } of FINANCIAL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { descriptiveId },
      update: { description },
      create: { descriptiveId, description },
    });
    permIds.push(perm.id);
  }
  console.log(`Ensured financial permissions: ${FINANCIAL_PERMISSIONS.map((p) => p.descriptiveId).join(', ')}\n`);

  // 2. Find all admin roles (global + org-specific)
  const adminRoles = await prisma.role.findMany({
    where: { name: { in: ADMIN_ROLE_NAMES } },
    include: { permissions: true, organization: true },
  });

  console.log(`Found ${adminRoles.length} admin role(s)\n`);

  for (const role of adminRoles) {
    const currentPermIds = new Set(role.permissions.map((p) => p.id));
    const missingPermIds = permIds.filter((id) => !currentPermIds.has(id));

    if (missingPermIds.length > 0) {
      const orgLabel = role.organization?.name ?? role.organizationId ?? 'global';
      console.log(
        `Role "${role.name}" (${orgLabel}) missing ${missingPermIds.length} financial permission(s) — adding...`,
      );

      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: missingPermIds.map((id) => ({ id })),
          },
        },
      });

      console.log(`  ✓ Added VIEW_FINANCIALS, MANAGE_FINANCIALS`);
    } else {
      const orgLabel = role.organization?.name ?? role.organizationId ?? 'global';
      console.log(`Role "${role.name}" (${orgLabel}) already has financial permissions — skipping`);
    }
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
