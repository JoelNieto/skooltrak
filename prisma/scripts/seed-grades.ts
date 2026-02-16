/**
 * Seed script to create fake grades in all courses of a school for a given period.
 * Creates Grade records with StudentGrade entries for each enrolled student.
 *
 * Usage:
 *   bun run prisma/scripts/seed-grades.ts <schoolId> <periodId> <numberOfGrades>
 *
 * Example:
 *   bun run prisma/scripts/seed-grades.ts clxyz123abc period456 20
 */

import { faker } from '@faker-js/faker/locale/es';
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

const GRADE_TITLES = [
  'Trabajo en clase',
  'Tarea 1',
  'Tarea 2',
  'Control de lectura',
  'Exposición',
  'Proyecto grupal',
  'Participación',
  'Quiz',
  'Prueba parcial',
  'Evaluación continua',
  'Informe',
  'Práctica',
  'Examen',
];

function randomScore(min: number, max: number, favorPass: boolean): number {
  if (favorPass) {
    // Bias toward passing grades (above typical 5.0 threshold)
    const passThreshold = min + (max - min) * 0.5;
    const r = Math.random();
    if (r < 0.7) {
      return faker.number.float({ min: passThreshold, max, fractionDigits: 2 });
    }
    return faker.number.float({ min, max, fractionDigits: 2 });
  }
  return faker.number.float({ min, max, fractionDigits: 2 });
}

async function main() {
  const [schoolId, periodId, countStr] = process.argv.slice(2);

  if (!schoolId || !periodId || !countStr) {
    console.error(
      'Usage: bun run prisma/scripts/seed-grades.ts <schoolId> <periodId> <numberOfGrades>'
    );
    process.exit(1);
  }

  const count = parseInt(countStr, 10);
  if (isNaN(count) || count < 1) {
    console.error('numberOfGrades must be a positive integer');
    process.exit(1);
  }

  // 1. Fetch school and period
  const [school, period] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      include: { organization: true },
    }),
    prisma.period.findUnique({
      where: { id: periodId },
    }),
  ]);

  if (!school) {
    console.error(`School with id "${schoolId}" not found.`);
    process.exit(1);
  }
  if (!period) {
    console.error(`Period with id "${periodId}" not found.`);
    process.exit(1);
  }

  console.log(`School: ${school.name}`);
  console.log(`Period: ${period.name} (${period.year}) - ${period.startDate.toISOString().slice(0, 10)} to ${period.endDate.toISOString().slice(0, 10)}`);

  // 2. Fetch all courses with buckets and students
  const courses = await prisma.course.findMany({
    where: { schoolId },
    include: {
      subject: true,
      studyPlan: { include: { gradeMetric: true } },
      gradeBuckets: true,
      students: { select: { id: true } },
    },
  });

  if (courses.length === 0) {
    console.error('No courses found for this school.');
    process.exit(1);
  }

  const coursesWithBuckets = courses.filter(
    (c) => c.gradeBuckets && c.gradeBuckets.length > 0
  );

  if (coursesWithBuckets.length === 0) {
    console.error('No courses with grade buckets found.');
    process.exit(1);
  }

  if (coursesWithBuckets.length < courses.length) {
    console.log(
      `Skipping ${courses.length - coursesWithBuckets.length} course(s) without buckets.`
    );
  }

  const periodStart = period.startDate.getTime();
  const periodEnd = period.endDate.getTime();

  let totalGrades = 0;
  let totalStudentGrades = 0;

  for (const course of coursesWithBuckets) {
    const buckets = course.gradeBuckets;
    const students = course.students;
    const metric = course.studyPlan?.gradeMetric;

    const minScore = metric
      ? Number(metric.minimum)
      : 0;
    const maxScore = metric
      ? Number(metric.maximum)
      : 10;

    if (students.length === 0) {
      console.log(`  Skipping "${course.name}" - no students enrolled`);
      continue;
    }

    // Distribute grades across buckets (round-robin)
    const titlesPool = [...GRADE_TITLES];
    faker.helpers.shuffle(titlesPool);

    console.log(`\nCourse: ${course.name} (${students.length} students, ${buckets.length} buckets)`);

    for (let i = 0; i < count; i++) {
      const bucket = buckets[i % buckets.length];
      const title =
        titlesPool[i % titlesPool.length] +
        (i >= titlesPool.length ? ` ${Math.floor(i / titlesPool.length) + 1}` : '');
      const date = new Date(
        periodStart + Math.random() * (periodEnd - periodStart)
      );

      await prisma.grade.create({
        data: {
          title,
          comments: '',
          courseId: course.id,
          bucketId: bucket.id,
          periodId: period.id,
          date,
          published: Math.random() < 0.8,
          studentGrades: {
            create: students.map((s) => ({
              studentId: s.id,
              score: randomScore(minScore, maxScore, true),
            })),
          },
        },
      });

      totalGrades++;
      totalStudentGrades += students.length;
    }

    console.log(`  ✓ Created ${count} grade(s)`);
  }

  console.log('\n========================================');
  console.log(`✓ Successfully created ${totalGrades} grade(s)`);
  console.log(`✓ Total student grade entries: ${totalStudentGrades}`);
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
