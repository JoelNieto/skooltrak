import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGradeStudentInput } from './dto/create-grade-student.input';
import { UpdateGradeStudentInput } from './dto/update-grade-student.input';

@Injectable()
export class GradeStudentsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createGradeStudentInput: CreateGradeStudentInput) {
    return this.prisma.gradeStudent.create({
      data: createGradeStudentInput,
    });
  }

  findAll() {
    return this.prisma.gradeStudent.findMany();
  }

  findOne(id: string) {
    return this.prisma.gradeStudent.findUnique({ where: { id } });
  }

  update(id: string, updateGradeStudentInput: UpdateGradeStudentInput) {
    return this.prisma.gradeStudent.update({
      where: { id },
      data: updateGradeStudentInput,
    });
  }

  remove(id: string) {
    return this.prisma.gradeStudent.delete({ where: { id } });
  }
}
