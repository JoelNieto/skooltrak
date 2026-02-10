/**
 * One-time fix: connect all permissions to org-specific ORG_ADMIN roles
 * that were created without permissions.
 *
 * Run with: bun run prisma/scripts/fix-role-permissions.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Get all permissions
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, descriptiveId: true },
  });
  console.log(`Found ${allPermissions.length} permissions in the system`);

  // 2. Find org-specific ORG_ADMIN roles with missing permissions
  const orgAdminRoles = await prisma.role.findMany({
    where: {
      name: 'ORG_ADMIN',
      organizationId: { not: null },
    },
    include: { permissions: true, organization: true },
  });

  console.log(`Found ${orgAdminRoles.length} org-specific ORG_ADMIN role(s)\n`);

  for (const role of orgAdminRoles) {
    const currentPerms = role.permissions.length;
    const totalPerms = allPermissions.length;

    if (currentPerms < totalPerms) {
      console.log(
        `Role "${role.name}" (org: ${role.organization?.name ?? role.organizationId}) has ${currentPerms}/${totalPerms} permissions — fixing...`,
      );

      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            set: allPermissions.map((p) => ({ id: p.id })),
          },
        },
      });

      console.log(`  ✓ Connected all ${totalPerms} permissions`);
    } else {
      console.log(
        `Role "${role.name}" (org: ${role.organization?.name ?? role.organizationId}) already has all ${currentPerms} permissions — skipping`,
      );
    }
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error('Fix failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
