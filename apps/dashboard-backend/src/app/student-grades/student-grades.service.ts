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

  findOne(id: string) {
    return this.prisma.studentGrade.findUnique({ where: { id } });
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
