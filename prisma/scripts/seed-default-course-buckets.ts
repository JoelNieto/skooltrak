/**
 * Sets default grade buckets for courses that don't have any.
 *
 * Run with: bun run prisma/scripts/seed-default-course-buckets.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const DEFAULT_BUCKETS = [
  { name: 'Notas diarias', weighting: 33.34 },
  { name: 'Apreciacion', weighting: 33.33 },
  { name: 'Examen final', weighting: 33.33 },
];

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const coursesWithoutBuckets = await prisma.course.findMany({
    where: {
      gradeBuckets: { none: {} },
    },
    include: { school: true, subject: true, studyPlan: true },
  });

  if (coursesWithoutBuckets.length === 0) {
    console.log('All courses already have grade buckets.');
    return;
  }

  console.log(`Found ${coursesWithoutBuckets.length} course(s) without buckets.\n`);

  for (const course of coursesWithoutBuckets) {
    console.log(
      `  Adding default buckets to: ${course.name} (${course.school.name} / ${course.studyPlan.name})`
    );

    await prisma.gradeBucket.createMany({
      data: DEFAULT_BUCKETS.map((bucket) => ({
        courseId: course.id,
        name: bucket.name,
        weight: bucket.weighting,
      })),
    });
  }

  console.log(`\nDone! Added default buckets to ${coursesWithoutBuckets.length} course(s).`);
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
