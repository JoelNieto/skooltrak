/**
 * Seed script to create fake students distributed across all class groups of a school.
 *
 * Usage:
 *   bun run prisma/scripts/seed-students.ts <schoolId> <numberOfStudents>
 *
 * Example:
 *   bun run prisma/scripts/seed-students.ts clxyz123abc 50
 */

import { faker } from '@faker-js/faker/locale/es';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import 'dotenv/config';
import { PrismaClient, type Gender } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = 'Student123!';

function generateStudentData(gender: Gender) {
  const sex = gender === 'MALE' ? 'male' : 'female';
  const firstName = faker.person.firstName(sex as 'male' | 'female');
  const middleName = faker.person.middleName(sex as 'male' | 'female');
  const fatherName = faker.person.lastName();
  const motherName = faker.person.lastName();
  const documentId = faker.string.numeric({ length: { min: 8, max: 12 } });
  const birthDate = faker.date.birthdate({ min: 5, max: 18, mode: 'age' });
  const address = faker.location.streetAddress();
  const phone = faker.phone.number();

  return {
    firstName,
    middleName,
    fatherName,
    motherName,
    documentId,
    birthDate,
    gender,
    address,
    phone,
  };
}

async function main() {
  const [schoolId, countStr] = process.argv.slice(2);

  if (!schoolId || !countStr) {
    console.error(
      'Usage: bun run prisma/scripts/seed-students.ts <schoolId> <numberOfStudents>'
    );
    process.exit(1);
  }

  const count = parseInt(countStr, 10);
  if (isNaN(count) || count < 1) {
    console.error('numberOfStudents must be a positive integer');
    process.exit(1);
  }

  // 1. Fetch the school
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { organization: true },
  });

  if (!school) {
    console.error(`School with id "${schoolId}" not found.`);
    process.exit(1);
  }
  console.log(`School: ${school.name} (org: ${school.organization.name})`);

  // 2. Fetch all active class groups for this school
  const classGroups = await prisma.classGroup.findMany({
    where: { schoolId, active: true },
    include: { studyPlan: true },
  });

  if (classGroups.length === 0) {
    console.error('No active class groups found for this school.');
    process.exit(1);
  }
  console.log(`Found ${classGroups.length} active class group(s):`);
  classGroups.forEach((g) =>
    console.log(`  - ${g.name} (plan: ${g.studyPlan.name})`)
  );

  // 3. Fetch courses per class group (via studyPlan)
  const coursesByGroup = new Map<string, string[]>();
  for (const group of classGroups) {
    const courses = await prisma.course.findMany({
      where: { schoolId, studyPlanId: group.studyPlanId },
      select: { id: true },
    });
    coursesByGroup.set(
      group.id,
      courses.map((c) => c.id)
    );
  }

  // 4. Hash default password once
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 5. Distribute students across groups (round-robin)
  const studentsPerGroup = Math.floor(count / classGroups.length);
  const remainder = count % classGroups.length;

  console.log(
    `\nCreating ${count} student(s) (~${studentsPerGroup} per group)...\n`
  );

  let created = 0;

  for (let gi = 0; gi < classGroups.length; gi++) {
    const group = classGroups[gi];
    const groupCount = studentsPerGroup + (gi < remainder ? 1 : 0);
    const courseIds = coursesByGroup.get(group.id) ?? [];

    console.log(`Group "${group.name}": creating ${groupCount} student(s)...`);

    for (let si = 0; si < groupCount; si++) {
      const gender: Gender = faker.helpers.arrayElement(['MALE', 'FEMALE']);
      const data = generateStudentData(gender);
      const email = faker.internet
        .email({
          firstName: data.firstName,
          lastName: data.fatherName,
          provider: 'student.skooltrak.com',
        })
        .toLowerCase();

      await prisma.$transaction(async (tx) => {
        // Create User
        const user = await tx.user.create({
          data: {
            email,
            name: `${data.firstName} ${data.fatherName}`,
            firstName: data.firstName,
            lastName: data.fatherName,
            password: hashedPassword,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`,
            emailVerified: true,
            organizationId: school.organizationId,
          },
        });

        // Create Account for better-auth
        await tx.account.create({
          data: {
            id: randomUUID(),
            accountId: user.id,
            providerId: 'credential',
            userId: user.id,
            password: hashedPassword,
          },
        });

        // Create Member (organization membership)
        await tx.member.create({
          data: {
            id: randomUUID(),
            organizationId: school.organizationId,
            userId: user.id,
            role: 'member',
          },
        });

        // Create Student
        await tx.student.create({
          data: {
            firstName: data.firstName,
            middleName: data.middleName,
            fatherName: data.fatherName,
            motherName: data.motherName,
            documentId: data.documentId,
            organizationId: school.organizationId,
            schoolId: school.id,
            classGroupId: group.id,
            birthDate: data.birthDate,
            gender: data.gender,
            address: data.address,
            phone: data.phone,
            userId: user.id,
            courses: courseIds.length
              ? { connect: courseIds.map((id) => ({ id })) }
              : undefined,
          },
        });
      });

      created++;
    }

    console.log(`  ✓ ${groupCount} student(s) created for "${group.name}"`);
  }

  console.log('\n========================================');
  console.log(`✓ Successfully created ${created} student(s)`);
  console.log('========================================');
  console.log(`Default password: ${DEFAULT_PASSWORD}`);
  console.log(`Email domain: @student.skooltrak.com`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
