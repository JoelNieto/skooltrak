import { Injectable } from '@nestjs/common';
import { FetchDataInput } from '../fetch-data.input';
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
    const course = await this.prisma.course.create({
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

    // Find all students in the same study plan (and school) to enroll in the new course
    const studentsToConnect = await this.prisma.student.findMany({
      where: {
        classGroup: { studyPlanId: createCourseInput.studyPlanId },
        schoolId: createCourseInput.schoolId,
      },
      select: { id: true },
    });

    const groupsToConnect = await this.prisma.classGroup.findMany({
      where: {
        studyPlanId: createCourseInput.studyPlanId,
        schoolId: createCourseInput.schoolId,
      },
      select: { id: true },
    });

    if (studentsToConnect.length > 0) {
      await this.prisma.course.update({
        where: { id: course.id },
        data: {
          students: {
            connect: studentsToConnect.map((s) => ({ id: s.id })),
          },
          groups: {
            connect: groupsToConnect.map((g) => ({ id: g.id })),
          },
        },
      });
    }

    return this.prisma.course.findUnique({
      where: { id: course.id },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { gradeMetric: true } },
      },
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, schoolId, search } = fetchDataInput;
    return this.prisma.course.findMany({
      where: {
        schoolId,
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { shortName: { contains: search } },
        ],
      },
      skip,
      take,
      include: { school: true, subject: true, studyPlan: true },
    });
  }

  count(fetchDataInput: FetchDataInput) {
    const { schoolId, search } = fetchDataInput;
    return this.prisma.course.count({
      where: {
        schoolId,
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { shortName: { contains: search } },
        ],
      },
    });
  }

  findManyBySchoolId(schoolId: string) {
    return this.prisma.course.findMany({
      where: { schoolId },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { degree: true } },
        currentPeriod: true,
      },
    });
  }

  findManyBySubjectId(subjectId: string) {
    return this.prisma.course.findMany({
      where: { subjectId },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { degree: true } },
        currentPeriod: true,
      },
    });
  }

  findManyByStudyPlanId(studyPlanId: string) {
    return this.prisma.course.findMany({
      where: { studyPlanId },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { degree: true } },
        currentPeriod: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { gradeMetric: true } },
        grades: { include: { gradeStudents: { include: { student: true } } } },
      },
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
