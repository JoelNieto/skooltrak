import { Prisma } from '@generated/prisma';
import { ACTIVE_ENROLLMENT } from '../courses/course-roster';

/**
 * What a teacher is responsible for (BR-HOM-001.7).
 *
 * Courses have no class-group link: a course belongs to a study plan, and every class group of that
 * plan takes its courses. So a teacher's groups are the class groups whose study plan contains one of
 * the teacher's courses. Being the homeroom teacher (`ClassGroup.teacherId`) alone does not count.
 * Broadcasts use the roster instead (`teacherRosterClassGroupWhere`); HOM-001 follows in its own slice.
 */
export function teacherCourseWhere(teacherId: string): Prisma.CourseWhereInput {
  return { teacherId };
}

export function teacherClassGroupWhere(teacherId: string): Prisma.ClassGroupWhereInput {
  return { studyPlan: { courses: { some: { teacherId } } } };
}

/**
 * The class groups a teacher may broadcast to (BR-COM-002.7, COM-002-S07): groups with at least one
 * student on the roster (ACA-001 BR .15) of a course the teacher teaches. Electives bring their
 * students' groups in; exclusions take a group out when none of its students is left on the roster.
 * Homeroom alone still doesn't count.
 */
export function teacherRosterClassGroupWhere(teacherId: string): Prisma.ClassGroupWhereInput {
  return { students: { some: { courseEnrollments: { some: { ...ACTIVE_ENROLLMENT, course: { teacherId } } } } } };
}
