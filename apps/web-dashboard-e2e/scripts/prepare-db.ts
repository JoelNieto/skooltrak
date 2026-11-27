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
        slug: data.schoolSlug,
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
        currentYear: new Date().getFullYear(),
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
      data: { name: data.finance.degree, shortName: 'PRE', schoolId: school.id },
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

    const teacherCourse = await prisma.course.create({
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
    const otherTeachersCourse = await prisma.course.create({
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

    const relatedGroup = await prisma.classGroup.create({
      data: {
        name: data.classGroups.related,
        organizationId: org.id,
        schoolId: school.id,
        studyPlanId: seventh.id,
        active: true,
      },
    });
    const homeroomOnlyGroup = await prisma.classGroup.create({
      data: {
        name: data.classGroups.homeroomOnly,
        organizationId: org.id,
        schoolId: school.id,
        studyPlanId: eighth.id,
        active: true,
        teacherId: users.teacher.teacherId, // homeroom only
      },
    });

    // HOM-001-S01: students to take attendance for, and slots on every weekday.
    const relatedStudentIds: string[] = [];
    for (const [i, firstName] of data.relatedStudents.entries()) {
      const student = await prisma.student.create({
        data: {
          firstName,
          middleName: '',
          fatherName: 'E2E',
          motherName: '',
          documentId: `E2E-STU-${i + 1}`,
          organizationId: org.id,
          schoolId: school.id,
          classGroupId: relatedGroup.id,
          birthDate: new Date('2013-05-01'),
          gender: i % 2 ? 'MALE' : 'FEMALE',
          address: 'Calle 1',
          phone: '000-0000',
          courseEnrollments: { create: { courseId: teacherCourse.id, source: 'PLAN' } },
        },
      });
      relatedStudentIds.push(student.id);
    }
    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
    await prisma.classGroupWeeklySchedule.createMany({
      data: weekdays.flatMap((weekday) => [
        { weekday, classGroupId: relatedGroup.id, courseId: teacherCourse.id, location: 'Aula 7', ...data.schedule.early },
        { weekday, classGroupId: relatedGroup.id, courseId: teacherCourse.id, location: 'Aula 7', ...data.schedule.late },
        {
          weekday,
          classGroupId: homeroomOnlyGroup.id,
          courseId: otherTeachersCourse.id,
          location: 'Aula 8',
          ...data.schedule.early,
        },
      ]),
    });

    // HOM-001-S02: a current period closing soon, an incomplete unpublished grade, and a submission to review.
    const day = 86_400_000;
    const now = Date.now();
    const period = await prisma.period.create({
      data: {
        name: data.period.name,
        shortName: 'PE2E',
        year: new Date().getFullYear(),
        startDate: new Date(now - 30 * day),
        endDate: new Date(now + data.period.closesInDays * day),
      },
    });
    const bucket = await prisma.gradeBucket.create({
      data: { name: data.grade.bucket, weight: 100, courseId: teacherCourse.id },
    });
    const grade = await prisma.grade.create({
      data: {
        title: data.grade.title,
        courseId: teacherCourse.id,
        bucketId: bucket.id,
        periodId: period.id,
        date: new Date(now - day),
        published: false,
      },
    });
    await prisma.studentGrade.create({ data: { gradeId: grade.id, studentId: relatedStudentIds[0], score: 4.5 } });

    const assignment = await prisma.assignment.create({
      data: {
        title: data.assignment.title,
        details: 'Entrega de prueba',
        type: 'PROJECT',
        date: new Date(now),
        requireSubmission: true,
        schoolId: school.id,
        courseId: teacherCourse.id,
        teacherId: users.teacher.teacherId,
        dates: { create: { classGroupId: relatedGroup.id, date: new Date(now) } },
      },
    });
    const file = await prisma.file.create({
      data: {
        organizationId: org.id,
        ownerId: users.admin.userId,
        name: 'proyecto.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageKey: 'e2e/proyecto.pdf',
      },
    });
    await prisma.assignmentSubmission.create({
      data: { assignmentId: assignment.id, studentId: relatedStudentIds[0], fileId: file.id },
    });

    // HOM-001-S03: a grade metric on the 7° plan, a published low grade, and a parent waiting for an answer.
    const metric = await prisma.gradeMetric.create({ data: data.metric });
    await prisma.studyPlan.update({ where: { id: seventh.id }, data: { gradeMetricId: metric.id } });
    const publishedGrade = await prisma.grade.create({
      data: {
        title: data.publishedGrade.title,
        courseId: teacherCourse.id,
        bucketId: bucket.id,
        periodId: period.id,
        date: new Date(now - 2 * day),
        published: true,
      },
    });
    await prisma.studentGrade.createMany({
      data: data.publishedScores.map((score, i) => ({ gradeId: publishedGrade.id, studentId: relatedStudentIds[i], score })),
    });

    const guardian = await prisma.parent.create({
      data: {
        firstName: personas.parent.firstName,
        fatherName: personas.parent.lastName,
        documentId: 'E2E-PAR-1',
        phone: '000-0000',
        email: personas.parent.email,
        relationship: 'Madre',
        organizationId: org.id,
        userId: users.parent.userId,
        students: { connect: [{ id: relatedStudentIds[0] }, { id: relatedStudentIds[1] }] },
      },
    });
    // COM-003: the teacher's direct conversation with the guardian about the first related student,
    // last written by the parent (HOM-001-S03 family message; parent home later).
    await prisma.directConversation.create({
      data: {
        organizationId: org.id,
        staffUserId: users.teacher.userId,
        parentUserId: users.parent.userId,
        studentId: relatedStudentIds[0],
        lastMessageAt: new Date(now - 3_600_000),
        staffLastReadAt: new Date(now - 3 * day),
        messages: {
          create: [
            { senderId: users.teacher.userId, body: 'Buenos días, le escribo por el taller.', createdAt: new Date(now - 3 * day) },
            { senderId: users.parent.userId, body: data.familyThread.parentMessage, createdAt: new Date(now - 3_600_000) },
          ],
        },
      },
    });
    console.log(`  guardian ${guardian.id} linked to the first related student`);

    // FIN-001: Ana and Beto share the guardian, so one family account; Carla has her own. (The API
    // would create these on the first finance read; seeding them lets the charges below exist.)
    const familyAccount = await prisma.familyAccount.create({
      data: {
        organizationId: org.id,
        schoolId: school.id,
        number: 1,
        students: {
          create: [
            { studentId: relatedStudentIds[0], schoolId: school.id },
            { studentId: relatedStudentIds[1], schoolId: school.id },
          ],
        },
      },
    });
    const soloAccount = await prisma.familyAccount.create({
      data: {
        organizationId: org.id,
        schoolId: school.id,
        number: 2,
        students: { create: [{ studentId: relatedStudentIds[2], schoolId: school.id }] },
      },
    });
    const utcDay = (offsetDays: number) => {
      const d = new Date(now + offsetDays * day);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    };

    // HOM-001-S06: a charge of the first related student due soon.
    await prisma.charge.create({
      data: {
        organizationId: org.id,
        schoolId: school.id,
        accountId: familyAccount.id,
        year: new Date().getFullYear(),
        studentId: relatedStudentIds[0],
        grossAmount: data.charge.amount,
        netAmount: data.charge.amount,
        dueDate: utcDay(data.charge.inDays),
        description: data.charge.description,
      },
    });

    // HOM-001-S08: what the school admin must attend to.
    const applicant = await prisma.user.create({
      data: {
        email: data.admin.applicant.email,
        name: `${data.admin.applicant.firstName} ${data.admin.applicant.lastName}`,
        firstName: data.admin.applicant.firstName,
        lastName: data.admin.applicant.lastName,
        password: passwordHash,
        emailVerified: true,
      },
    });
    await prisma.joinRequest.create({ data: { userId: applicant.id, schoolId: school.id, requestedRole: 'TEACHER' } });
    await prisma.charge.create({
      data: {
        organizationId: org.id,
        schoolId: school.id,
        accountId: soloAccount.id,
        year: new Date().getFullYear(),
        studentId: relatedStudentIds[2],
        grossAmount: data.admin.overdueCharge.amount,
        netAmount: data.admin.overdueCharge.amount,
        dueDate: utcDay(data.admin.overdueCharge.inDays),
        description: data.admin.overdueCharge.description,
      },
    });
    await prisma.importJob.create({
      data: { organizationId: org.id, schoolId: school.id, entityType: 'STUDENT', status: 'FAILED', totalRows: 10, errorCount: 3 },
    });

    // HOM-001-S04: the student persona is the first related student; work for each status.
    await prisma.student.update({ where: { id: relatedStudentIds[0] }, data: { userId: users.student.userId } });
    for (const [key, w] of Object.entries(data.studentWork)) {
      const otherGroup = key === 'otherGroup';
      const due = new Date(now + w.inDays * day);
      await prisma.assignment.create({
        data: {
          title: w.title,
          details: 'Trabajo de prueba',
          type: w.type,
          date: due,
          requireSubmission: w.requireSubmission,
          schoolId: school.id,
          courseId: otherGroup ? otherTeachersCourse.id : teacherCourse.id,
          teacherId: otherGroup ? users.otherTeacher.teacherId : users.teacher.teacherId,
          dates: { create: { classGroupId: otherGroup ? homeroomOnlyGroup.id : relatedGroup.id, date: due } },
        },
      });
    }

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
