/**
 * Rebuilds the isolated e2e database from migrations and seeds the known dataset in
 * `src/support/fixtures.ts`. Wipes the target database; `e2eDatabaseUrl()` refuses any database
 * whose name does not contain "e2e".
 *
 *   bun apps/web-dashboard-e2e/scripts/prepare-db.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import { resolve } from 'path';
import { PrismaClient } from '@generated/prisma';
import { data, E2E_PASSWORD, personas } from '../src/support/fixtures';
import { assertE2eDatabase, e2eDatabaseUrl } from './e2e-env';

const workspaceRoot = resolve(__dirname, '../../..');

function run(cmd: string, args: string[], databaseUrl: string) {
  execFileSync(cmd, args, {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}

async function seedFixtures(databaseUrl: string) {
  assertE2eDatabase(databaseUrl);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
    const roleId = async (name: string) =>
      (await prisma.role.findFirstOrThrow({ where: { name, organizationId: null }, select: { id: true } })).id;

    const org = await prisma.organization.create({
      data: { name: data.organization, description: 'Datos de prueba e2e', onboardingCompleted: true },
    });

    const school = await prisma.school.create({
      data: {
        organizationId: org.id,
        name: data.school,
        shortName: 'E2E',
        logo: '',
        address: 'Calle 1',
        city: 'Ciudad',
        state: 'Estado',
        zip: '0000',
        country: 'PA',
        email: 'colegio@skooltrak.test',
        phone: '000-0000',
        website: 'https://skooltrak.test',
      },
    });

    const users = {} as Record<keyof typeof personas, { userId: string; teacherId?: string }>;
    for (const [key, p] of Object.entries(personas) as [keyof typeof personas, (typeof personas)[keyof typeof personas]][]) {
      const user = await prisma.user.create({
        data: {
          email: p.email,
          name: `${p.firstName} ${p.lastName}`,
          firstName: p.firstName,
          lastName: p.lastName,
          password: passwordHash,
          emailVerified: true,
          roleId: await roleId(p.role),
          organizationId: org.id,
          onboardingStep: 'completed',
        },
      });
      await prisma.account.create({
        data: { id: randomUUID(), accountId: user.id, providerId: 'credential', userId: user.id, password: passwordHash },
      });
      await prisma.member.create({
        data: { id: randomUUID(), organizationId: org.id, userId: user.id, role: p.role === 'ORG_ADMIN' ? 'owner' : 'member' },
      });

      let teacherId: string | undefined;
      if (p.role === 'TEACHER') {
        const teacher = await prisma.teacher.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            firstName: p.firstName,
            middleName: '',
            fatherName: p.lastName,
            motherName: '',
            documentId: `E2E-${key}`,
            birthDate: new Date('1985-01-01'),
            gender: 'FEMALE',
          },
        });
        teacherId = teacher.id;
      }
      users[key] = { userId: user.id, teacherId };
    }

    const degree = await prisma.degree.create({
      data: { name: 'Premedia E2E', shortName: 'PRE', schoolId: school.id },
    });
    const plan = (name: string, level: number) =>
      prisma.studyPlan.create({
        data: { name, shortName: name, level, description: name, degreeId: degree.id, schoolId: school.id },
      });
    const seventh = await plan(data.studyPlans.seventh, 7);
    const eighth = await plan(data.studyPlans.eighth, 8);

    const subject = (name: string, code: string) =>
      prisma.subject.create({ data: { organizationId: org.id, name, code } });
    const math = await subject('Matemáticas', 'MAT');
    const science = await subject('Ciencias', 'CIE');

    await prisma.course.create({
      data: {
        ...data.courses.teacherOwn,
        shortName: 'MAT7',
        organizationId: org.id,
        schoolId: school.id,
        subjectId: math.id,
        studyPlanId: seventh.id,
        teacherId: users.teacher.teacherId,
      },
    });
    await prisma.course.create({
      data: {
        ...data.courses.otherTeachers,
        shortName: 'CIE8',
        organizationId: org.id,
        schoolId: school.id,
        subjectId: science.id,
        studyPlanId: eighth.id,
        teacherId: users.otherTeacher.teacherId,
      },
    });

    await prisma.classGroup.create({
      data: {
        name: data.classGroups.related,
        organizationId: org.id,
        schoolId: school.id,
        studyPlanId: seventh.id,
        active: true,
      },
    });
    await prisma.classGroup.create({
      data: {
        name: data.classGroups.homeroomOnly,
        organizationId: org.id,
        schoolId: school.id,
        studyPlanId: eighth.id,
        active: true,
        teacherId: users.teacher.teacherId, // homeroom only
      },
    });

    console.log(`✓ Seeded e2e fixtures (org ${org.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const databaseUrl = e2eDatabaseUrl();
  console.log(`Preparing e2e database "${new URL(databaseUrl).pathname.slice(1)}"…`);
  // Prisma 7 `migrate reset` does not run the seed, so roles and fixtures are seeded explicitly.
  run('bunx', ['prisma', 'migrate', 'reset', '--force'], databaseUrl);
  run('bun', ['prisma/scripts/seed-roles-permissions.ts'], databaseUrl);
  await seedFixtures(databaseUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
