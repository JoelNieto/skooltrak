import { sendGradePublishedEmail } from '@/auth';
import { courseAverage } from '@/shared';
import { Injectable } from '@nestjs/common';
import { enrolledIn } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGradeInput: CreateGradeInput) {
    // One score cell per student on the roster (ACA-001 BR .15).
    const students = await this.prisma.student.findMany({
      where: enrolledIn(createGradeInput.courseId),
      select: { id: true },
    });

    return this.prisma.grade.create({
      data: {
        ...createGradeInput,
        studentGrades: {
          create: students.map((s) => ({
            student: { connect: { id: s.id } },
          })),
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.grade.findUnique({
      where: { id },
      include: {
        period: true,
        bucket: true,
        course: { include: { studyPlan: { include: { gradeMetric: true } } } },
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
  async update(id: string, updateGradeInput: UpdateGradeInput, actorId: string | null = null) {
    const existing = await this.prisma.grade.findUnique({
      where: { id },
      select: { published: true },
    });
    const publishing = updateGradeInput.published === true && existing?.published === false;
    const unpublishing = updateGradeInput.published === false && existing?.published === true;

    const updated = await this.prisma.grade.update({
      where: { id },
      data: {
        ...updateGradeInput,
        ...(publishing ? { publishedAt: new Date(), publishedById: actorId } : {}),
        ...(unpublishing ? { publishedAt: null, publishedById: null } : {}),
      },
    });

    if (publishing) {
      await this.notifyPublished(updated.id);
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
