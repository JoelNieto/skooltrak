import { AuthUserContext } from '@/auth';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const SCHOOL_DENIED = 'La escuela no pertenece a tu organización';
export const ORG_REQUIRED = 'Organization context required';

/** The caller's organization; 403 when the session has none. */
export function requireOrganization(user: AuthUserContext | undefined): string {
  if (!user?.organizationId) throw new ForbiddenException(ORG_REQUIRED);
  return user.organizationId;
}

/** Throws 403 unless the school belongs to the caller's organization (404 when it doesn't exist). */
export async function assertSchoolInOrganization(
  prisma: PrismaService,
  user: AuthUserContext | undefined,
  schoolId: string | undefined,
): Promise<string> {
  const organizationId = requireOrganization(user);
  if (!schoolId) throw new ForbiddenException(SCHOOL_DENIED);
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { organizationId: true } });
  if (!school) throw new NotFoundException('Escuela no encontrada');
  if (school.organizationId !== organizationId) throw new ForbiddenException(SCHOOL_DENIED);
  return organizationId;
}

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/**
 * Throws 403 (`message`) unless the caller is an admin of the course's organization or the course's
 * teacher. Returns the course.
 */
export async function assertCourseStaff(
  prisma: PrismaService,
  user: AuthUserContext | undefined,
  courseId: string,
  message: string,
): Promise<{ id: string; organizationId: string; schoolId: string; teacherId: string | null }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, organizationId: true, schoolId: true, teacherId: true },
  });
  if (!course) throw new NotFoundException('Curso no encontrado');
  if (!user?.userId || user.organizationId !== course.organizationId) throw new ForbiddenException(message);
  if (ADMIN_ROLES.has(user.role?.toUpperCase() ?? '')) return course;
  if (course.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.userId, organizationId: course.organizationId },
      select: { id: true },
    });
    if (teacher?.id === course.teacherId) return course;
  }
  throw new ForbiddenException(message);
}
