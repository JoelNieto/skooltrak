import { AuthUserContext } from '@/auth';
import { EnrollmentStatus, Prisma } from '@generated/prisma';
import { ForbiddenException } from '@nestjs/common';
import { ACTIVE_ENROLLMENT } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';
import { teacherClassGroupWhere } from '../teachers/teacher-scope';

export const NOT_AUTHENTICATED = 'Not authenticated';
export const STAFF_ONLY = 'Solo el personal de la escuela y los docentes pueden iniciar comunicaciones';
export const NO_STUDENTS_DIRECT = 'Los estudiantes no tienen acceso a los mensajes directos';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);
const FAMILY_ROLES = new Set(['PARENT', 'STUDENT']);

/**
 * A member of staff, with their reach (COM-003 BR .2 / .8). Admins, and any other non-teacher
 * staff role granted the permission, reach the whole organization; teachers reach their courses
 * and the class groups related to them.
 */
export interface StaffCaller {
  userId: string;
  organizationId: string;
  admin: boolean;
  /** The teacher record when the caller is a teacher; null for admins and teachers without one. */
  teacherId: string | null;
}

export function roleOf(user: AuthUserContext | undefined): string {
  return user?.role?.toUpperCase() ?? '';
}

export function requireUser(user: AuthUserContext | undefined): AuthUserContext {
  if (!user?.userId) throw new ForbiddenException(NOT_AUTHENTICATED);
  return user;
}

/** Whether the role can start communications at all (BR .1). Doesn't throw. */
export function isStaffRole(user: AuthUserContext | undefined): boolean {
  const role = roleOf(user);
  return !!role && !FAMILY_ROLES.has(role) && !!user?.organizationId;
}

/** BR .1: parents and students never start communications. Throws 403. */
export async function requireStaff(prisma: PrismaService, user: AuthUserContext | undefined): Promise<StaffCaller> {
  requireUser(user);
  if (!isStaffRole(user)) throw new ForbiddenException(STAFF_ONLY);
  return (await staffCaller(prisma, user)) as StaffCaller;
}

/** The caller as staff, or null when they aren't staff. */
export async function staffCaller(prisma: PrismaService, user: AuthUserContext | undefined): Promise<StaffCaller | null> {
  if (!user?.userId || !isStaffRole(user)) return null;
  const organizationId = user.organizationId as string;
  const role = roleOf(user);
  if (role !== 'TEACHER') return { userId: user.userId, organizationId, admin: true, teacherId: null };
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.userId, organizationId },
    select: { id: true },
  });
  return { userId: user.userId, organizationId, admin: false, teacherId: teacher?.id ?? null };
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.has(role.toUpperCase());
}

/**
 * Channels the staff member manages (BR .3): every channel of the organization for admins; for
 * teachers, the channels of their courses and of class groups related to them.
 */
export function managedChannelWhere(staff: StaffCaller): Prisma.ChannelWhereInput {
  if (staff.admin) return { organizationId: staff.organizationId };
  if (!staff.teacherId) return { id: { in: [] } };
  return {
    organizationId: staff.organizationId,
    OR: [
      { scope: 'COURSE', course: { teacherId: staff.teacherId } },
      { scope: 'CLASS_GROUP', classGroup: teacherClassGroupWhere(staff.teacherId) },
    ],
  };
}

/**
 * Active students the staff member reaches (BR .8): the whole organization for admins; for
 * teachers, students on one of their course rosters or in a class group related to their courses.
 */
export function reachableStudentWhere(staff: StaffCaller): Prisma.StudentWhereInput {
  const base: Prisma.StudentWhereInput = { organizationId: staff.organizationId, enrollmentStatus: EnrollmentStatus.ACTIVE };
  if (staff.admin) return base;
  if (!staff.teacherId) return { id: { in: [] } };
  return {
    ...base,
    OR: [
      { courseEnrollments: { some: { ...ACTIVE_ENROLLMENT, course: { teacherId: staff.teacherId } } } },
      { classGroup: teacherClassGroupWhere(staff.teacherId) },
    ],
  };
}
