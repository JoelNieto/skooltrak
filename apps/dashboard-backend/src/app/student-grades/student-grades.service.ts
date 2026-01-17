import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStudentGradeInput } from './dto/create-student-grade.input';
import { UpdateStudentGradeInput } from './dto/update-student-grade.input';

@Injectable()
export class StudentGradesService {
  constructor(private readonly prisma: PrismaService) {}
  create(createStudentGradeInput: CreateStudentGradeInput) {
    return this.prisma.studentGrade.create({
      data: createStudentGradeInput,
    });
  }

  findAll() {
    return this.prisma.studentGrade.findMany();
  }

  findByCourseId(courseId: string, periodId?: string, studentId?: string) {
    return this.prisma.studentGrade.findMany({
      where: { grade: { courseId, periodId, published: true }, studentId },
      include: {
        grade: {
          include: {
            period: true,
            bucket: true,
            course: true,
          },
        },
        student: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.studentGrade.findUnique({ where: { id } });
  }

  async getAverageScoreForStudent(
    courseId: string,
    periodId: string,
    studentId: string
  ) {
    const grades = await this.prisma.studentGrade.findMany({
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

  update(id: string, updateStudentGradeInput: UpdateStudentGradeInput) {
    return this.prisma.studentGrade.update({
      where: { id },
      data: updateStudentGradeInput,
    });
  }

  remove(id: string) {
    return this.prisma.studentGrade.delete({ where: { id } });
  }
}
