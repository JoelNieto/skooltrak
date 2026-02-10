/**
 * Data migration script to migrate existing auth data to better-auth structure
 *
 * Run with: bun run prisma/scripts/migrate-to-better-auth.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('Starting better-auth data migration...\n');

  // 1. Update User names from firstName + lastName
  console.log('1. Updating user names...');
  const users = await prisma.user.findMany({
    where: { name: null },
  });

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: `${user.firstName} ${user.lastName}`.trim() },
    });
  }
  console.log(`   Updated ${users.length} users with names\n`);

  // 2. Create Account records for users with passwords
  console.log('2. Creating Account records for credential-based auth...');
  const usersWithPasswords = await prisma.user.findMany({
    where: {
      password: { not: '' },
    },
  });

  let accountsCreated = 0;
  for (const user of usersWithPasswords) {
    // Check if account already exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id, // Use the user's ID as the accountId
          providerId: 'credential',
          userId: user.id,
          password: user.password, // Keep the existing bcrypt hash
        },
      });
      accountsCreated++;
    }
  }
  console.log(`   Created ${accountsCreated} account records\n`);

  // 3. Update organization slugs
  console.log('3. Updating organization slugs...');
  const organizations = await prisma.organization.findMany({
    where: { slug: null },
  });

  for (const org of organizations) {
    let baseSlug = generateSlug(org.name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await prisma.organization.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { slug },
    });
  }
  console.log(`   Updated ${organizations.length} organizations with slugs\n`);

  // 4. Create Member records linking users to organizations
  console.log('4. Creating Member records...');
  const usersWithOrgs = await prisma.user.findMany({
    where: {
      organizationId: { not: null },
    },
    include: {
      role: true,
    },
  });

  let membersCreated = 0;
  for (const user of usersWithOrgs) {
    if (!user.organizationId) continue;

    // Check if member already exists
    const existingMember = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: user.organizationId,
          userId: user.id,
        },
      },
    });

    if (!existingMember) {
      // Map existing role to better-auth role
      let memberRole = 'member';
      const roleName = user.role.name.toUpperCase();

      if (roleName.includes('ADMIN') || roleName.includes('OWNER')) {
        memberRole = 'owner';
      } else if (roleName.includes('TEACHER')) {
        memberRole = 'admin';
      }

      await prisma.member.create({
        data: {
          id: randomUUID(),
          organizationId: user.organizationId,
          userId: user.id,
          role: memberRole,
        },
      });
      membersCreated++;
    }
  }
  console.log(`   Created ${membersCreated} member records\n`);

  // 5. Set emailVerified to true for existing users (they were already verified via the old system)
  console.log('5. Setting existing users as email verified...');
  const verifiedCount = await prisma.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true },
  });
  console.log(`   Updated ${verifiedCount.count} users as email verified\n`);

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
