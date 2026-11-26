import { AuthUserContext } from '@/auth';
import { Prisma } from '@generated/prisma';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { enrolledIn as onRoster } from '../courses/course-roster';
import { assertPeriodForSchool } from '../periods/school-periods';
import { PrismaService } from '../prisma.service';

/**
 * Who may read or change grades (ASM-001-S01, BR-ASM-001.1 / .9 / .13).
 *
 * - Writes: the course's teacher or an admin of the course's organization.
 * - Reads: the same staff see every row, drafts included. Students, parents and homeroom teachers
 *   see published grades only, and only their own, their linked children's or their homeroom
 *   group's rows (ACA-001 BR .16).
 */
export const WRITE_DENIED = 'Solo puedes calificar tus propios cursos';
export const READ_DENIED = 'No puedes ver estas calificaciones';
export const UNPUBLISH_DENIED = 'Solo un administrador puede despublicar calificaciones';
export const NOT_ENROLLED = 'El estudiante no pertenece a este curso';
export const MOVE_DENIED = 'No se puede mover una calificación a otro curso o estudiante';
export const BUCKET_MISMATCH = 'La ponderación no pertenece a este curso';
export const ASSIGNMENT_MISMATCH = 'La asignación no pertenece a este curso';
export const ASSIGNMENT_TAKEN = 'Esta asignación ya tiene una calificación';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/** What the caller may see in one course. `studentIds: null` means every student (staff). */
export interface CourseReadScope {
  courseId: string;
  staff: boolean;
  studentIds: string[] | null;
}

type CourseRef = { id: string; organizationId: string; studyPlanId: string; teacherId: string | null };

@Injectable()
export class GradeAccessService {
  constructor(private readonly prisma: PrismaService) {}

  isAdmin(user: AuthUserContext | undefined): boolean {
    return ADMIN_ROLES.has(user?.role?.toUpperCase() ?? '');
  }

  /** Throws 403 unless the caller may create, change or delete grades of this course. */
  async assertCanWriteCourse(user: AuthUserContext | undefined, courseId: string): Promise<void> {
    const { userId, organizationId } = this.requireOrganization(user);
    const course = await this.course(courseId);
    if (course.organizationId !== organizationId) throw new ForbiddenException(WRITE_DENIED);
    if (this.isAdmin(user)) return;
    if (!(await this.teachesCourse(userId, organizationId, course))) {
      throw new ForbiddenException(WRITE_DENIED);
    }
  }

  /** Throws 403 unless the caller may read grades of this course; returns which rows they may see. */
  async readScope(user: AuthUserContext | undefined, courseId: string): Promise<CourseReadScope> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const course = await this.course(courseId);
    const role = user.role?.toUpperCase();
    const staff: CourseReadScope = { courseId, staff: true, studentIds: null };

    if (this.isAdmin(user)) {
      if (course.organizationId !== user.organizationId) throw new ForbiddenException(READ_DENIED);
      return staff;
    }

    if (role === 'TEACHER') {
      if (course.organizationId !== user.organizationId) throw new ForbiddenException(READ_DENIED);
      if (await this.teachesCourse(user.userId, course.organizationId, course)) return staff;
      // Homeroom teacher: read-only, published grades of their homeroom group's students.
      const homeroom = await this.prisma.student.findMany({
        where: {
          ...enrolledIn(course),
          classGroup: { teacher: { userId: user.userId, organizationId: course.organizationId } },
        },
        select: { id: true },
      });
      return this.limitedTo(courseId, homeroom);
    }

    if (role === 'STUDENT') {
      const self = await this.prisma.student.findMany({
        where: { ...enrolledIn(course), userId: user.userId },
        select: { id: true },
      });
      return this.limitedTo(courseId, self);
    }

    if (role === 'PARENT') {
      // Parents can span organizations (BR-HOM-001.9): the child's enrollment decides, not the
      // caller's current organization.
      const children = await this.prisma.student.findMany({
        where: { ...enrolledIn(course), parents: { some: { userId: user.userId } } },
        select: { id: true },
      });
      return this.limitedTo(courseId, children);
    }

    throw new ForbiddenException(READ_DENIED);
  }

  /** Throws 403 unless the caller may read this student's grades in this course. */
  async assertCanReadStudent(
    user: AuthUserContext | undefined,
    courseId: string,
    studentId: string,
  ): Promise<CourseReadScope> {
    const scope = await this.readScope(user, courseId);
    if (!canSeeStudent(scope, studentId)) throw new ForbiddenException(READ_DENIED);
    return scope;
  }

  /**
   * Whose published grades across all of a student's courses the caller may read:
   * `'all'` for an admin of the student's organization, the student, a linked parent or the
   * student's homeroom teacher; otherwise, for a teacher, only the courses they teach.
   * Throws 403 for anyone else.
   */
  async studentCoursesScope(user: AuthUserContext | undefined, studentId: string): Promise<'all' | Set<string>> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        organizationId: true,
        userId: true,
        parents: { select: { userId: true } },
        classGroup: { select: { teacher: { select: { userId: true } } } },
      },
    });
    if (!student) throw new NotFoundException('Estudiante no encontrado');
    const role = user.role?.toUpperCase();

    if (role === 'STUDENT' && student.userId === user.userId) return 'all';
    if (role === 'PARENT' && student.parents.some((p) => p.userId === user.userId)) return 'all';
    if (student.organizationId !== user.organizationId) throw new ForbiddenException(READ_DENIED);
    if (this.isAdmin(user)) return 'all';

    if (role === 'TEACHER') {
      if (student.classGroup?.teacher?.userId === user.userId) return 'all';
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.userId, organizationId: student.organizationId },
        select: { courses: { select: { id: true } } },
      });
      const taught = new Set((teacher?.courses ?? []).map((c) => c.id));
      if (taught.size) return taught;
    }
    throw new ForbiddenException(READ_DENIED);
  }

  /** Throws 403 when a non-admin tries to unpublish a published grade (BR-ASM-001.9). */
  assertCanChangePublished(user: AuthUserContext | undefined, wasPublished: boolean, published?: boolean): void {
    if (wasPublished && published === false && !this.isAdmin(user)) {
      throw new ForbiddenException(UNPUBLISH_DENIED);
    }
  }

  async gradeRef(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      select: { id: true, courseId: true, published: true },
    });
    if (!grade) throw new NotFoundException('Calificación no encontrada');
    return grade;
  }

  async studentGradeRef(id: string) {
    const row = await this.prisma.studentGrade.findUnique({
      where: { id },
      select: { id: true, studentId: true, gradeId: true, grade: { select: { courseId: true, published: true } } },
    });
    if (!row) throw new NotFoundException('Calificación no encontrada');
    return row;
  }

  async bucketRef(id: string) {
    const bucket = await this.prisma.gradeBucket.findUnique({ where: { id }, select: { id: true, courseId: true } });
    if (!bucket) throw new NotFoundException('Ponderación no encontrada');
    return bucket;
  }

  /** A grade's bucket must belong to the same course (400 otherwise). */
  async assertBucketInCourse(bucketId: string, courseId: string): Promise<void> {
    const found = await this.prisma.gradeBucket.count({ where: { id: bucketId, courseId } });
    if (!found) throw new BadRequestException(BUCKET_MISMATCH);
  }

  /** A grade's period must be one the course's school uses (its own or the global ones; 400 otherwise). */
  async assertPeriodForCourse(periodId: string, courseId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { schoolId: true } });
    if (!course) throw new NotFoundException('Curso no encontrado');
    await assertPeriodForSchool(this.prisma, periodId, course.schoolId);
  }

  /**
   * BR-ASM-001.11: a column may be linked to an assignment of the same course (400 otherwise) that no
   * other column is linked to (409). Returns what the column takes from it: title and date.
   */
  async assertAssignmentLinkable(
    assignmentId: string,
    courseId: string,
    gradeId?: string,
  ): Promise<{ title: string; date: Date }> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { courseId: true, title: true, date: true, grade: { select: { id: true } } },
    });
    if (!assignment || assignment.courseId !== courseId) throw new BadRequestException(ASSIGNMENT_MISMATCH);
    if (assignment.grade && assignment.grade.id !== gradeId) throw new ConflictException(ASSIGNMENT_TAKEN);
    return { title: assignment.title, date: assignment.date };
  }

  /** A grade row can only be written for a student enrolled in the course (400 otherwise). */
  async assertStudentEnrolled(courseId: string, studentId: string): Promise<void> {
    const course = await this.course(courseId);
    const found = await this.prisma.student.count({ where: { ...enrolledIn(course), id: studentId } });
    if (!found) throw new BadRequestException(NOT_ENROLLED);
  }

  private limitedTo(courseId: string, students: { id: string }[]): CourseReadScope {
    if (!students.length) throw new ForbiddenException(READ_DENIED);
    return { courseId, staff: false, studentIds: students.map((s) => s.id) };
  }

  private requireOrganization(user: AuthUserContext | undefined): { userId: string; organizationId: string } {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    if (!user.organizationId) throw new ForbiddenException('Organization context required');
    return { userId: user.userId, organizationId: user.organizationId };
  }

  private async course(courseId: string): Promise<CourseRef> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true, studyPlanId: true, teacherId: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    return course;
  }

  /** BR-HOM-001.7: the caller's Teacher record in this organization teaches the course. */
  private async teachesCourse(userId: string, organizationId: string, course: CourseRef): Promise<boolean> {
    if (!course.teacherId) return false;
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });
    return teacher?.id === course.teacherId;
  }
}

/** Students on the course's roster (ACA-001 BR .15), in the course's organization. */
function enrolledIn(course: CourseRef): Prisma.StudentWhereInput {
  return { organizationId: course.organizationId, ...onRoster(course.id) };
}

export function canSeeStudent(scope: CourseReadScope, studentId: string): boolean {
  return scope.studentIds === null || scope.studentIds.includes(studentId);
}

/**
 * Trims a grade (with its studentGrades) to what the scope may see. Returns null when a
 * non-staff caller asks for an unpublished grade.
 */
export function scopeGrade<G extends { published: boolean; studentGrades?: { studentId: string }[] }>(
  grade: G,
  scope: CourseReadScope,
): G | null {
  if (scope.staff) return grade;
  if (!grade.published) return null;
  if (!grade.studentGrades) return grade;
  return { ...grade, studentGrades: grade.studentGrades.filter((sg) => canSeeStudent(scope, sg.studentId)) };
}
