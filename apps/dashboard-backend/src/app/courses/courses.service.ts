import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCourseInput: CreateCourseInput) {
    return this.prisma.course.create({
      data: createCourseInput,
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  findAll() {
    return this.prisma.course.findMany({
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  update(id: string, updateCourseInput: UpdateCourseInput) {
    return this.prisma.course.update({
      where: { id },
      data: updateCourseInput,
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  remove(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }
}
