/**
 * Seed script to create a SYSADMIN user.
 *
 * IMPORTANT: Run seed-roles-permissions.ts first to create global roles.
 *
 * Run with: bun run prisma/scripts/seed-admin.ts
 */

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env['ADMIN_EMAIL'];
  const password = process.env['ADMIN_PASSWORD'];
  const firstName = process.env['ADMIN_FIRST_NAME'];
  const lastName = process.env['ADMIN_LAST_NAME'];

  if (!email || !password || !firstName || !lastName) {
    throw new Error(
      'Missing required env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME'
    );
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists!`);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Creating SYSADMIN user...\n');

  const result = await prisma.$transaction(async (tx) => {
    // 1. Look up the global SYSADMIN role (created by seed-roles-permissions.ts)
    const role = await tx.role.findFirst({
      where: { name: 'SYSADMIN', organizationId: null },
    });

    if (!role) {
      throw new Error(
        'Global SYSADMIN role not found. Run seed-roles-permissions.ts first.'
      );
    }
    console.log(`✓ Found global role: ${role.name}`);

    // 2. Create User (no organization)
    const user = await tx.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        password: hashedPassword,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`,
        roleId: role.id,
        emailVerified: true,
      },
    });
    console.log(`✓ Created user: ${user.email}`);

    // 3. Create Account for better-auth
    await tx.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: hashedPassword,
      },
    });
    console.log(`✓ Created credential account`);

    return { user };
  });

  console.log('\n========================================');
  console.log('SYSADMIN user created successfully!');
  console.log('========================================');
  console.log(`Email: ${email}`);
  console.log(`Role: SYSADMIN`);
  console.log(`\nThis user has no organization and has full system access.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
