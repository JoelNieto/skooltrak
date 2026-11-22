import { AuthUserContext } from '@/auth';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { enrolledIn } from './course-roster';
import { COURSE_DENIED } from './courses.service';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/**
 * Who is looking at a course page (ACA-001 BR .3):
 * - STAFF: an admin of the course's organization, or its teacher (full access);
 * - HOMEROOM: a homeroom teacher of a group with students enrolled in the course (read-only, BR .16);
 * - STUDENT: the enrolled student; PARENT: a parent of an enrolled, linked child (any organization,
 *   BR-HOM-001.9). Both carry that student.
 */
export type CourseViewer =
  | { kind: 'STAFF'; organizationId: string; student: null }
  /** `userId`: the homeroom teacher, whose group's students they may see (BR .16). */
  | { kind: 'HOMEROOM'; organizationId: string; student: null; userId: string }
  | { kind: 'STUDENT' | 'PARENT'; organizationId: string; student: CourseViewerStudent };

export interface CourseViewerStudent {
  id: string;
  firstName: string;
  classGroup: { id: string; name: string } | null;
}

const STUDENT_SELECT = { id: true, firstName: true, classGroup: { select: { id: true, name: true } } } as const;

@Injectable()
export class CourseAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Throws 403 "No tienes acceso a este curso" unless BR .3 lets the caller see the course. */
  async viewer(user: AuthUserContext | undefined, courseId: string, studentId?: string): Promise<CourseViewer> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { organizationId: true, teacherId: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    const organizationId = course.organizationId;
    const role = user.role?.toUpperCase() ?? '';
    const sameOrg = user.organizationId === organizationId;

    if (sameOrg && ADMIN_ROLES.has(role)) return { kind: 'STAFF', organizationId, student: null };

    if (sameOrg && role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.userId, organizationId },
        select: { id: true },
      });
      if (teacher && teacher.id === course.teacherId) return { kind: 'STAFF', organizationId, student: null };
      const homeroom = await this.prisma.student.count({
        where: { organizationId, ...enrolledIn(courseId), classGroup: { teacher: { userId: user.userId } } },
      });
      if (homeroom) return { kind: 'HOMEROOM', organizationId, student: null, userId: user.userId };
      throw new ForbiddenException(COURSE_DENIED);
    }

    if (sameOrg && role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({
        where: { userId: user.userId, organizationId, ...enrolledIn(courseId) },
        select: STUDENT_SELECT,
      });
      if (student) return { kind: 'STUDENT', organizationId, student };
      throw new ForbiddenException(COURSE_DENIED);
    }

    if (role === 'PARENT') {
      // The requested child, else the first linked child enrolled in the course.
      const child = await this.prisma.student.findFirst({
        where: {
          ...(studentId ? { id: studentId } : {}),
          organizationId,
          parents: { some: { userId: user.userId } },
          ...enrolledIn(courseId),
        },
        select: STUDENT_SELECT,
        orderBy: { firstName: 'asc' },
      });
      if (child) return { kind: 'PARENT', organizationId, student: child };
    }

    throw new ForbiddenException(COURSE_DENIED);
  }
}
