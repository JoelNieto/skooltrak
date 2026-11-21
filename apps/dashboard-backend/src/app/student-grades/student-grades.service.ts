import { courseAverage } from '@/shared';
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
