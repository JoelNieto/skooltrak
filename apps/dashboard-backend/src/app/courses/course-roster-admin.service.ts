import { AuthUserContext } from '@/auth';
import { EnrollmentSource, Prisma } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ACTIVE_ENROLLMENT } from './course-roster';
import { COURSE_DENIED } from './courses.service';

export const STUDENT_NOT_ELIGIBLE = 'El estudiante no pertenece a la escuela de este curso';
export const NOT_ON_ROSTER = 'El estudiante no está en este curso';
const CANDIDATE_LIMIT = 20;

const STUDENT_SELECT = {
  id: true,
  firstName: true,
  fatherName: true,
  documentId: true,
  classGroup: { select: { id: true, name: true } },
} as const;
type StudentRow = Prisma.StudentGetPayload<{ select: typeof STUDENT_SELECT }>;

/** One row of the admin roster (FR-ACA-001.19). */
export interface RosterEntry {
  student: RosterStudent;
  /** PLAN: "Plan de estudio"; MANUAL: "Agregado". */
  source: EnrollmentSource;
  /** A PLAN enrollment an admin removed (an exemption); not counted anywhere (BR .15). */
  excluded: boolean;
  addedBy: string | null;
  createdAt: Date;
}

export interface RosterStudent {
  id: string;
  name: string;
  initials: string;
  documentId: string;
  classGroup: { id: string; name: string } | null;
}

/**
 * An admin manages a course's roster (ACA-001 FR .19, BR .15): adds students outside its study
 * plan (MANUAL, e.g. an elective) and removes students (a MANUAL row is deleted; a PLAN row is
 * marked excluded, e.g. an exemption, and can be restored). Grades and submissions are never
 * deleted; a removed student is only hidden from the course. Routes need `MANAGE_COURSES`.
 */
@Injectable()
export class CourseRosterAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every enrollment, excluded ones included so they can be restored; excluded last, then by name. */
  async roster(user: AuthUserContext | undefined, courseId: string): Promise<RosterEntry[]> {
    await this.course(user, courseId);
    const rows = await this.prisma.courseEnrollment.findMany({
      where: { courseId },
      select: {
        source: true,
        excluded: true,
        createdAt: true,
        addedBy: { select: { firstName: true, lastName: true, name: true } },
        student: { select: STUDENT_SELECT },
      },
      orderBy: [{ excluded: 'asc' }, { student: { firstName: 'asc' } }, { student: { fatherName: 'asc' } }],
    });
    return rows.map((r) => ({
      student: toStudent(r.student),
      source: r.source,
      excluded: r.excluded,
      addedBy: r.addedBy ? [r.addedBy.firstName, r.addedBy.lastName].filter(Boolean).join(' ') || r.addedBy.name : null,
      createdAt: r.createdAt,
    }));
  }

  /** Students of the course's school who aren't actively enrolled, matching `search` (name or document). */
  async candidates(user: AuthUserContext | undefined, courseId: string, search = ''): Promise<RosterStudent[]> {
    const course = await this.course(user, courseId);
    const terms = search.trim().split(/\s+/).filter(Boolean);
    const students = await this.prisma.student.findMany({
      where: {
        organizationId: course.organizationId,
        schoolId: course.schoolId,
        enrollmentStatus: 'ACTIVE',
        NOT: { courseEnrollments: { some: { ...ACTIVE_ENROLLMENT, courseId } } },
        AND: terms.map((t) => ({
          OR: [
            { firstName: { contains: t, mode: 'insensitive' as const } },
            { middleName: { contains: t, mode: 'insensitive' as const } },
            { fatherName: { contains: t, mode: 'insensitive' as const } },
            { motherName: { contains: t, mode: 'insensitive' as const } },
            { documentId: { contains: t, mode: 'insensitive' as const } },
          ],
        })),
      },
      select: STUDENT_SELECT,
      orderBy: [{ firstName: 'asc' }, { fatherName: 'asc' }],
      take: CANDIDATE_LIMIT,
    });
    return students.map(toStudent);
  }

  /**
   * Adds a student: a new MANUAL row, or restores an excluded PLAN row. Already enrolled: no change.
   * A student of another organization or school gets 400 (BR .15).
   */
  async add(user: AuthUserContext | undefined, courseId: string, studentId: string): Promise<RosterEntry> {
    const course = await this.course(user, courseId);
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId: course.organizationId, schoolId: course.schoolId },
      select: { id: true },
    });
    if (!student) throw new BadRequestException(STUDENT_NOT_ELIGIBLE);

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { id: true, excluded: true },
    });
    if (existing?.excluded) {
      await this.prisma.courseEnrollment.update({ where: { id: existing.id }, data: { excluded: false } });
    } else if (!existing) {
      await this.prisma.courseEnrollment.create({
        data: { courseId, studentId, source: EnrollmentSource.MANUAL, addedById: user?.userId ?? null },
      });
    }
    return this.entry(courseId, studentId);
  }

  /** Removes a student: deletes a MANUAL row, marks a PLAN row excluded. Not on the roster: 404. */
  async remove(user: AuthUserContext | undefined, courseId: string, studentId: string): Promise<{ removed: true }> {
    await this.course(user, courseId);
    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { id: true, source: true, excluded: true },
    });
    if (!existing || existing.excluded) throw new NotFoundException(NOT_ON_ROSTER);
    if (existing.source === EnrollmentSource.MANUAL) {
      await this.prisma.courseEnrollment.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.courseEnrollment.update({ where: { id: existing.id }, data: { excluded: true } });
    }
    return { removed: true };
  }

  private async entry(courseId: string, studentId: string): Promise<RosterEntry> {
    const r = await this.prisma.courseEnrollment.findUniqueOrThrow({
      where: { courseId_studentId: { courseId, studentId } },
      select: {
        source: true,
        excluded: true,
        createdAt: true,
        addedBy: { select: { firstName: true, lastName: true, name: true } },
        student: { select: STUDENT_SELECT },
      },
    });
    return {
      student: toStudent(r.student),
      source: r.source,
      excluded: r.excluded,
      addedBy: r.addedBy ? [r.addedBy.firstName, r.addedBy.lastName].filter(Boolean).join(' ') || r.addedBy.name : null,
      createdAt: r.createdAt,
    };
  }

  /** The course, in the caller's organization (403 otherwise; the route already needs MANAGE_COURSES). */
  private async course(user: AuthUserContext | undefined, courseId: string) {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true, schoolId: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    if (course.organizationId !== user.organizationId) throw new ForbiddenException(COURSE_DENIED);
    return course;
  }
}

function toStudent(s: StudentRow): RosterStudent {
  return {
    id: s.id,
    name: `${s.firstName} ${s.fatherName}`,
    initials: `${s.firstName.charAt(0)}${s.fatherName.charAt(0)}`,
    documentId: s.documentId,
    classGroup: s.classGroup,
  };
}
