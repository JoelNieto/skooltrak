/**
 * Ensure VIEW_STORE and MANAGE_STORE exist and assign to admin roles and VIEW_STORE to teacher/student/parent roles.
 *
 * Run with: bun run prisma/scripts/add-store-permissions.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

const STORE_PERMISSIONS: { descriptiveId: string; description: string }[] = [
  { descriptiveId: 'VIEW_STORE', description: 'Browse the school store and place orders' },
  { descriptiveId: 'MANAGE_STORE', description: 'Manage school store products, categories, and orders' },
];

const ADMIN_ROLE_NAMES = ['ORG_ADMIN', 'SYSADMIN', 'ADMIN'];

async function main() {
  const permIds: string[] = [];
  for (const { descriptiveId, description } of STORE_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { descriptiveId },
      update: { description },
      create: { descriptiveId, description },
    });
    permIds.push(perm.id);
  }
  console.log(`Ensured permissions: ${STORE_PERMISSIONS.map((p) => p.descriptiveId).join(', ')}\n`);

  const adminRoles = await prisma.role.findMany({
    where: { name: { in: ADMIN_ROLE_NAMES } },
    include: { permissions: true },
  });

  for (const role of adminRoles) {
    const current = new Set(role.permissions.map((p) => p.id));
    const missing = permIds.filter((id) => !current.has(id));
    if (missing.length) {
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: { connect: missing.map((id) => ({ id })) } },
      });
      console.log(`Role ${role.name}: added store permissions`);
    }
  }

  const viewPerm = await prisma.permission.findUnique({ where: { descriptiveId: 'VIEW_STORE' } });
  if (!viewPerm) throw new Error('VIEW_STORE not found');

  const viewRoles = await prisma.role.findMany({
    where: { name: { in: ['TEACHER', 'STUDENT', 'PARENT'] } },
    include: { permissions: true },
  });

  for (const role of viewRoles) {
    const has = role.permissions.some((p) => p.descriptiveId === 'VIEW_STORE');
    if (!has) {
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: { connect: { id: viewPerm.id } } },
      });
      console.log(`Role ${role.name}: added VIEW_STORE`);
    }
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
