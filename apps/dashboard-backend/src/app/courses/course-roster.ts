import { EnrollmentSource, Prisma } from '@generated/prisma';

/**
 * Course roster rules (ACA-001 BR .15). A course's students are its `CourseEnrollment` rows:
 * - PLAN rows follow the student's class group's study plan, and are kept in sync here;
 * - MANUAL rows are added by an admin and are never touched by sync;
 * - `excluded` hides a PLAN row (an exemption). Every reader must skip excluded rows, so read the
 *   roster through `enrolledIn` / `enrolledCourses` / `ACTIVE_ENROLLMENT`, never the table directly.
 *
 * The sync functions take a Prisma client or a transaction client, so callers can keep the roster
 * change atomic with the write that caused it.
 */
export type RosterDb = Pick<Prisma.TransactionClient, 'course' | 'student' | 'classGroup' | 'courseEnrollment'>;

/** `courseEnrollments` filter for enrollments that count: not excluded. */
export const ACTIVE_ENROLLMENT = { excluded: false } satisfies Prisma.CourseEnrollmentWhereInput;

/** Students actively enrolled in the course, or in any of the courses. For `student.findMany`. */
export function enrolledIn(courseIds: string | string[]): Prisma.StudentWhereInput {
  const courseId = typeof courseIds === 'string' ? courseIds : { in: courseIds };
  return { courseEnrollments: { some: { ...ACTIVE_ENROLLMENT, courseId } } };
}

/** Courses the matching student is actively enrolled in. For `course.findMany`. */
export function enrolledCourses(student: Prisma.StudentWhereInput): Prisma.CourseWhereInput {
  return { enrollments: { some: { ...ACTIVE_ENROLLMENT, student } } };
}

/**
 * Brings a student's PLAN enrollments in line with their class group (student created, imported or
 * moved between groups). Removes PLAN rows for courses outside the new plan, exclusions included, and
 * adds the new plan's courses. Same-plan exclusions and MANUAL rows are kept.
 *
 * @returns the ids of the plan's courses the student is now actively enrolled in.
 */
export async function syncStudentPlan(db: RosterDb, studentId: string, classGroupId: string | null): Promise<string[]> {
  const student = await db.student.findUniqueOrThrow({ where: { id: studentId }, select: { organizationId: true } });
  const organizationId = student.organizationId;

  const group = classGroupId
    ? await db.classGroup.findFirst({ where: { id: classGroupId, organizationId }, select: { studyPlanId: true } })
    : null;
  const planCourseIds = group
    ? (
        await db.course.findMany({ where: { studyPlanId: group.studyPlanId, organizationId }, select: { id: true } })
      ).map((c) => c.id)
    : [];

  await db.courseEnrollment.deleteMany({
    where: { studentId, source: EnrollmentSource.PLAN, courseId: { notIn: planCourseIds } },
  });
  if (!planCourseIds.length) return [];

  const existing = await db.courseEnrollment.findMany({
    where: { studentId, courseId: { in: planCourseIds } },
    select: { courseId: true, excluded: true },
  });
  const known = new Set(existing.map((e) => e.courseId));
  const added = planCourseIds.filter((id) => !known.has(id));
  if (added.length) {
    await db.courseEnrollment.createMany({
      data: added.map((courseId) => ({ courseId, studentId, source: EnrollmentSource.PLAN })),
      skipDuplicates: true,
    });
  }

  const excluded = new Set(existing.filter((e) => e.excluded).map((e) => e.courseId));
  return planCourseIds.filter((id) => !excluded.has(id));
}

type CourseRef = { id: string; studyPlanId: string; organizationId: string };

/**
 * Enrolls every student of the course's study plan who isn't on the roster yet (course created).
 *
 * @returns the ids of the students added.
 */
export async function enrollPlanStudents(db: RosterDb, course: CourseRef): Promise<string[]> {
  const students = await db.student.findMany({
    where: {
      organizationId: course.organizationId,
      classGroup: { studyPlanId: course.studyPlanId },
      courseEnrollments: { none: { courseId: course.id } },
    },
    select: { id: true },
  });
  if (students.length) {
    await db.courseEnrollment.createMany({
      data: students.map((s) => ({ courseId: course.id, studentId: s.id, source: EnrollmentSource.PLAN })),
      skipDuplicates: true,
    });
  }
  return students.map((s) => s.id);
}

/**
 * Re-syncs a course whose study plan changed (decided 2026-11-20): its PLAN rows, exclusions
 * included, are replaced by the new plan's students. MANUAL rows are kept. Grades and submissions
 * are untouched; students who leave the roster are only hidden from the course.
 */
export async function resyncCoursePlan(db: RosterDb, course: CourseRef): Promise<string[]> {
  await db.courseEnrollment.deleteMany({ where: { courseId: course.id, source: EnrollmentSource.PLAN } });
  return enrollPlanStudents(db, course);
}
