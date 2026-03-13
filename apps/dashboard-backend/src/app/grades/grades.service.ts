import { sendGradePublishedEmail } from '@/auth';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGradeInput: CreateGradeInput) {
    const students = await this.prisma.course.findUnique({
      where: { id: createGradeInput.courseId },
      include: { students: true },
    });

    return this.prisma.grade.create({
      data: {
        ...createGradeInput,
        studentGrades: {
          create: students.students.map((s) => ({
            student: { connect: { id: s.id } },
          })),
        },
      },
    });
  }

  findAll() {
    return this.prisma.grade.findMany();
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
    return (
      grades
        .filter((grade) => grade.score !== null)
        .reduce(
          (acc, grade) =>
            acc +
            (grade.score?.toNumber() ?? 0) *
              grade.grade.bucket.weight.toNumber(),
          0
        ) /
        grades
          .filter((grade) => grade.score !== null)
          .reduce(
            (acc, grade) => acc + grade.grade.bucket.weight.toNumber(),
            0
          ) || 0
    );
  }

  async update(id: string, updateGradeInput: UpdateGradeInput) {
    const existing = await this.prisma.grade.findUnique({
      where: { id },
      select: { published: true },
    });

    const updated = await this.prisma.grade.update({
      where: { id },
      data: updateGradeInput,
    });

    if (
      updateGradeInput.published === true &&
      existing?.published === false
    ) {
      await this.sendGradePublishedNotifications(updated.id);
    }

    return updated;
  }

  private async sendGradePublishedNotifications(gradeId: string) {
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
