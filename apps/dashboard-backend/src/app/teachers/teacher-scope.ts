import { Prisma } from '@generated/prisma';

/**
 * What a teacher is responsible for (BR-COM-002.7, reused by BR-HOM-001.7).
 *
 * Courses have no class-group link: a course belongs to a study plan, and every class group of that
 * plan takes its courses. So a teacher's groups are the class groups whose study plan contains one of
 * the teacher's courses. Being the homeroom teacher (`ClassGroup.teacherId`) alone does not count.
 */
export function teacherCourseWhere(teacherId: string): Prisma.CourseWhereInput {
  return { teacherId };
}

export function teacherClassGroupWhere(teacherId: string): Prisma.ClassGroupWhereInput {
  return { studyPlan: { courses: { some: { teacherId } } } };
}
