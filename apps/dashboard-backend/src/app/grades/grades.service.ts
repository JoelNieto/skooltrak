import { sendGradePublishedEmail } from '@/auth';
import { courseAverage } from '@/shared';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma';
import { ASSIGNMENT_TAKEN } from './grade-access.service';
import { alertInBackground } from './homeroom-alerts';
import { enrolledIn } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { PLAN_METRIC_INCLUDE, withEffectiveMetric } from '../study-plans/plan-settings';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A new column, with one score cell per student on the roster (ACA-001 BR .15).
   * - Linked to an assignment, it takes the assignment's title and date (BR-ASM-001.11).
   * - Created already published, it is stamped and families are notified, as when published later
   *   (BR-ASM-001.9).
   */
  async create(
    createGradeInput: CreateGradeInput,
    actorId: string | null = null,
    link: { title: string; date: Date } | null = null,
  ) {
    const students = await this.prisma.student.findMany({
      where: enrolledIn(createGradeInput.courseId),
      select: { id: true },
    });

    const created = await uniqueLink(() =>
      this.prisma.grade.create({
        data: {
          ...createGradeInput,
          ...(link ?? {}),
          ...(createGradeInput.published ? { publishedAt: new Date(), publishedById: actorId } : {}),
          studentGrades: {
            create: students.map((s) => ({
              student: { connect: { id: s.id } },
            })),
          },
        },
      }),
    );
    if (created.published) {
      await this.notifyPublished(created.id);
      alertInBackground(this.prisma, created.id, { actorUserId: actorId });
    }
    return created;
  }

  async findOne(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        period: true,
        bucket: true,
        course: { include: { studyPlan: { include: PLAN_METRIC_INCLUDE } } },
        studentGrades: {
          include: {
            student: { include: { classGroup: true } },
          },
          orderBy: {
            student: {
              firstName: 'asc',
            },
          },
        },
      },
    });
    if (!grade) return grade;
    return { ...grade, course: { ...grade.course, studyPlan: withEffectiveMetric(grade.course.studyPlan) } };
  }

  findByCourseId(courseId: string, periodId?: string) {
    return this.prisma.grade.findMany({
      where: { courseId, periodId },
      include: {
        period: true,
        bucket: true,
        course: true,
        studentGrades: {
          include: {
            student: { include: { classGroup: true } },
          },
          orderBy: {
            student: {
              firstName: 'asc',
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAverageScoreForStudent(
    courseId: string,
    periodId: string,
    studentId: string
  ) {
    const grades = await this.prisma.studentGrade.findMany({
      where: { grade: { courseId, periodId, published: true }, studentId },
      include: {
        grade: {
          include: {
            bucket: true,
          },
        },
      },
    });
    // ASM-001 BR .4; null when the student has no scored grade (never 0).
    return courseAverage(
      grades.map((g) => ({ bucketId: g.grade.bucketId, weight: g.grade.bucket.weight.toNumber(), score: g.score?.toNumber() })),
    );
  }

  /**
   * Publishing stamps when and by whom (BR-ASM-001.9) and notifies students and parents;
   * unpublishing (admins only, checked by the controller) clears the stamp and notifies no one.
   */
  async update(
    id: string,
    updateGradeInput: UpdateGradeInput,
    actorId: string | null = null,
    link: { title: string; date: Date } | null = null,
  ) {
    const existing = await this.prisma.grade.findUnique({
      where: { id },
      select: { published: true },
    });
    const publishing = updateGradeInput.published === true && existing?.published === false;
    const unpublishing = updateGradeInput.published === false && existing?.published === true;

    const updated = await uniqueLink(() =>
      this.prisma.grade.update({
        where: { id },
        data: {
          ...updateGradeInput,
          // Linking takes the assignment's title and date (BR-ASM-001.11).
          ...(link ?? {}),
          ...(publishing ? { publishedAt: new Date(), publishedById: actorId } : {}),
          ...(unpublishing ? { publishedAt: null, publishedById: null } : {}),
        },
      }),
    );

    if (publishing) {
      await this.notifyPublished(updated.id);
      // BR-ASM-001.12: homeroom teachers of students below the pass mark.
      alertInBackground(this.prisma, updated.id, { actorUserId: actorId });
    }

    return updated;
  }

  /** The existing published-grade emails to each student and their parents (FR-ASM-001.7). */
  async notifyPublished(gradeId: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        course: true,
        studentGrades: {
          include: {
            student: {
              include: {
                user: true,
                parents: true,
              },
            },
          },
        },
      },
    });

    if (!grade) return;

    const courseName = grade.course.name;
    const gradeTitle = grade.title;

    const emailsSent = new Set<string>();

    for (const sg of grade.studentGrades) {
      const student = sg.student;
      const studentName = [
        student.firstName,
        student.middleName,
        student.fatherName,
        student.motherName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (student.user?.email && !emailsSent.has(student.user.email)) {
        try {
          await sendGradePublishedEmail({
            to: student.user.email,
            studentName,
            gradeTitle,
            courseName,
          });
          emailsSent.add(student.user.email);
        } catch (error) {
          console.error(
            `[GradesService] Failed to send grade published email to student ${student.user.email}:`,
            error,
          );
        }
      }

      for (const parent of student.parents) {
        if (parent.email && !emailsSent.has(parent.email)) {
          try {
            await sendGradePublishedEmail({
              to: parent.email,
              studentName,
              gradeTitle,
              courseName,
            });
            emailsSent.add(parent.email);
          } catch (error) {
            console.error(
              `[GradesService] Failed to send grade published email to parent ${parent.email}:`,
              error,
            );
          }
        }
      }
    }
  }

  remove(id: string) {
    return this.prisma.grade.delete({ where: { id } });
  }
}

/** Two columns linked to one assignment at once: the unique index refuses the second (BR-ASM-001.11). */
async function uniqueLink<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(ASSIGNMENT_TAKEN);
    }
    throw error;
  }
}
