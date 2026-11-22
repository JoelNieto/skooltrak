import { AuthUserContext } from '@/auth';
import { Prisma } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { enrolledIn } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';

export const WRITE_DENIED = 'Solo puedes gestionar las asignaciones de tus propios cursos';
export const READ_DENIED = 'No tienes acceso a estas asignaciones';
export const MOVE_DENIED = 'No se puede mover una asignación a otro curso o escuela';
export const GROUP_MISMATCH = 'El grupo no pertenece a la escuela del curso';
export const TEACHER_MISMATCH = 'El docente no pertenece a la organización del curso';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/**
 * Which class groups' assignment dates the caller may see. `null` means every group: staff (admins
 * and teachers) of the organization. Students and parents get their own or their children's groups.
 */
export type GroupScope = string[] | null;

type CourseRef = { id: string; organizationId: string; schoolId: string; teacherId: string | null };

/**
 * Who may read or change assignments:
 * - writes: an admin of the course's organization, or the course's teacher;
 * - reads: admins and teachers of the organization; an enrolled student or a linked parent of one,
 *   limited to their class groups' dates.
 */
@Injectable()
export class AssignmentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Throws 403 unless the caller may create, change or delete this course's assignments. */
  async assertCanWrite(user: AuthUserContext | undefined, courseId: string): Promise<CourseRef> {
    const course = await this.course(courseId);
    if (!user?.userId || user.organizationId !== course.organizationId) throw new ForbiddenException(WRITE_DENIED);
    if (isAdmin(user)) return course;
    if (user.role?.toUpperCase() === 'TEACHER' && course.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.userId, organizationId: course.organizationId },
        select: { id: true },
      });
      if (teacher?.id === course.teacherId) return course;
    }
    throw new ForbiddenException(WRITE_DENIED);
  }

  /** The class groups whose dates the caller may see in this course (403 when none). */
  async courseScope(user: AuthUserContext | undefined, courseId: string): Promise<GroupScope> {
    const course = await this.course(courseId);
    return this.scope(user, course.organizationId, { organizationId: course.organizationId, ...enrolledIn(course.id) });
  }

  /** The class groups whose dates the caller may see in this school (403 when none). */
  async schoolScope(user: AuthUserContext | undefined, schoolId: string): Promise<GroupScope> {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId }, select: { organizationId: true } });
    if (!school) throw new NotFoundException('Escuela no encontrada');
    return this.scope(user, school.organizationId, { organizationId: school.organizationId, schoolId });
  }

  async assignmentRef(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      select: { id: true, courseId: true, schoolId: true },
    });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    return assignment;
  }

  /** The teacher, when given, and every dated group must belong to the course's organization and school (400). */
  async assertInputFits(
    course: CourseRef,
    input: { teacherId?: string | null; groupDates?: { classGroupId: string }[] },
  ): Promise<void> {
    if (input.teacherId) {
      const found = await this.prisma.teacher.count({
        where: { id: input.teacherId, organizationId: course.organizationId },
      });
      if (!found) throw new BadRequestException(TEACHER_MISMATCH);
    }
    const groupIds = [...new Set((input.groupDates ?? []).map((d) => d.classGroupId))];
    if (groupIds.length) {
      const found = await this.prisma.classGroup.count({
        where: { id: { in: groupIds }, organizationId: course.organizationId, schoolId: course.schoolId },
      });
      if (found !== groupIds.length) throw new BadRequestException(GROUP_MISMATCH);
    }
  }

  async course(courseId: string): Promise<CourseRef> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true, schoolId: true, teacherId: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    return course;
  }

  private async scope(
    user: AuthUserContext | undefined,
    organizationId: string,
    students: Prisma.StudentWhereInput,
  ): Promise<GroupScope> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const role = user.role?.toUpperCase();
    const sameOrg = user.organizationId === organizationId;
    if (sameOrg && (isAdmin(user) || role === 'TEACHER')) return null;

    // Parents may span organizations (BR-HOM-001.9): the child's enrollment decides.
    let link: Prisma.StudentWhereInput | null = null;
    if (role === 'STUDENT' && sameOrg) link = { userId: user.userId };
    if (role === 'PARENT') link = { parents: { some: { userId: user.userId } } };
    if (!link) throw new ForbiddenException(READ_DENIED);

    const rows = await this.prisma.student.findMany({ where: { ...students, ...link }, select: { classGroupId: true } });
    if (!rows.length) throw new ForbiddenException(READ_DENIED);
    return [...new Set(rows.map((r) => r.classGroupId).filter((id): id is string => !!id))];
  }
}

function isAdmin(user: AuthUserContext): boolean {
  return ADMIN_ROLES.has(user.role?.toUpperCase() ?? '');
}

/**
 * The groups to filter dates by: the requested one, if the scope allows it (403 otherwise), else
 * the whole scope. `undefined` means no filter.
 */
export function groupFilter(scope: GroupScope, requested?: string): string[] | undefined {
  if (scope === null) return requested ? [requested] : undefined;
  if (requested) {
    if (!scope.includes(requested)) throw new ForbiddenException(READ_DENIED);
    return [requested];
  }
  return scope;
}
