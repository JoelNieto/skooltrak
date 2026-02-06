/**
 * Seed script to create an admin user.
 *
 * IMPORTANT: Run seed-roles-permissions.ts first to create global roles.
 *
 * Run with: bun run prisma/scripts/seed-admin.ts
 */

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'joelnieto1215@gmail.com';
  const password = 'Skooltrak123!'; // Change this!
  const firstName = 'Admin';
  const lastName = 'User';
  const organizationName = 'Skooltrak';
  const schoolShortName = 'SKOOL';

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

  // Generate slug
  const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  console.log('Creating organization, user, and school...\n');

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug,
        description: 'Demo organization',
        active: true,
      },
    });
    console.log(`✓ Created organization: ${organization.name}`);

    // 2. Look up the global ORG_ADMIN role (created by seed-roles-permissions.ts)
    const role = await tx.role.findFirst({
      where: { name: 'ORG_ADMIN', organizationId: null },
    });

    if (!role) {
      throw new Error('Global ORG_ADMIN role not found. Run seed-roles-permissions.ts first.');
    }
    console.log(`✓ Found global role: ${role.name}`);

    // 3. Create User
    const user = await tx.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        password: hashedPassword,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`,
        roleId: role.id,
        organizationId: organization.id,
        emailVerified: true,
      },
    });
    console.log(`✓ Created user: ${user.email}`);

    // 4. Create Account for better-auth
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

    // 5. Create Member
    await tx.member.create({
      data: {
        id: randomUUID(),
        organizationId: organization.id,
        userId: user.id,
        role: 'owner',
      },
    });
    console.log(`✓ Created member record`);

    // 6. Create School
    const school = await tx.school.create({
      data: {
        name: organizationName,
        shortName: schoolShortName,
        organizationId: organization.id,
        logo: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        email: '',
        phone: '',
        website: '',
      },
    });
    console.log(`✓ Created school: ${school.name}`);

    return { user, organization, school };
  });

  console.log('\n========================================');
  console.log('Admin user created successfully!');
  console.log('========================================');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Organization: ${result.organization.name}`);
  console.log('\nYou can now login at http://localhost:4200/login');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
