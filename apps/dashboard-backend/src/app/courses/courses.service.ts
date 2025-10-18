import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCourseInput: CreateCourseInput) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: createCourseInput.subjectId },
    });
    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id: createCourseInput.studyPlanId },
    });
    return this.prisma.course.create({
      data: {
        ...createCourseInput,
        shortName: createCourseInput.shortName
          ? `${createCourseInput.shortName}`
          : `${subject?.shortName} - ${studyPlan?.shortName}`,
        name: createCourseInput.name
          ? `${createCourseInput.name}`
          : `${subject?.name} - ${studyPlan?.name}`,
        code: createCourseInput.code
          ? `${createCourseInput.code}`
          : `${subject?.code} - ${studyPlan?.code}`,
      },
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  findAll() {
    return this.prisma.course.findMany({
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  findManyBySchoolId(schoolId: string) {
    return this.prisma.course.findMany({
      where: { schoolId },
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  findManyBySubjectId(subjectId: string) {
    return this.prisma.course.findMany({
      where: { subjectId },
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  findManyByStudyPlanId(studyPlanId: string) {
    return this.prisma.course.findMany({
      where: { studyPlanId },
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
