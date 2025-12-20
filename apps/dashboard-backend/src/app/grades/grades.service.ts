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
        gradeStudents: {
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
        gradeStudents: {
          include: {
            student: true,
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
        gradeStudents: {
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
    const grades = await this.prisma.gradeStudent.findMany({
      where: { grade: { courseId, periodId }, studentId },
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

  update(id: string, updateGradeInput: UpdateGradeInput) {
    return this.prisma.grade.update({
      where: { id },
      data: updateGradeInput,
    });
  }

  remove(id: string) {
    return this.prisma.grade.delete({ where: { id } });
  }
}
