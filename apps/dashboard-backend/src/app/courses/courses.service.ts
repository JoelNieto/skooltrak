import { Prisma } from '@generated/prisma';

import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';
@Injectable({ scope: Scope.REQUEST })
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}

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
          : `${subject?.code} - ${studyPlan?.shortName}`,
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

    if (studentsToConnect.length > 0) {
      await this.prisma.course.update({
        where: { id: course.id },
        data: {
          students: {
            connect: studentsToConnect.map((s) => ({ id: s.id })),
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

  async replicate(targetStudyPlanId: string, sourceStudyPlanId: string) {
    const courses = await this.prisma.course.findMany({
      where: { studyPlanId: sourceStudyPlanId },
    });
    return this.prisma.course.createMany({
      data: courses.map((course) => ({
        ...course,
        studyPlanId: targetStudyPlanId,
      })),
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { req } = this.context;
    const { role, userId } = req.user as any;
    const { skip, take, schoolId, search, studyPlanId } = fetchDataInput;
    let where: Prisma.CourseWhereInput = {
      schoolId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (role === 'STUDENT') {
      where = {
        ...where,
        studyPlan: { classGroups: { some: { students: { some: { userId } } } } },
      };
    }

    if (role === 'TEACHER') {
      where = { ...where, teacher: { user: { id: userId } } };
    }

    if (studyPlanId) {
      where = { ...where, studyPlanId };
    }

    return this.prisma.course.findMany({
      where,
      skip,
      take,
      include: {
        school: true,
        subject: true,
        studyPlan: true,
        currentPeriod: true,
        teacher: true,
      },
    });
  }

  count(fetchDataInput: FetchDataInput) {
    const { req } = this.context;
    const { role, userId } = req.user as any;
    const { schoolId, search, studyPlanId } = fetchDataInput;
    let where: Prisma.CourseWhereInput = {
      schoolId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (role === 'STUDENT') {
      where = {
        ...where,
        studyPlan: { classGroups: { some: { students: { some: { userId } } } } },
      };
    }

    if (role === 'TEACHER') {
      where = { ...where, teacher: { user: { id: userId } } };
    }

    if (studyPlanId) {
      where = { ...where, studyPlanId };
    }
    return this.prisma.course.count({
      where,
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
        teacher: { include: { user: true } },
        studyPlan: { include: { gradeMetric: true } },
        grades: { include: { studentGrades: { include: { student: true } } } },
      },
    });
  }

  async findManyByGroupId(groupId: string) {
    const group = await this.prisma.classGroup.findUnique({
      where: { id: groupId },
      select: { studyPlanId: true },
    });
    if (!group) return [];
    return this.prisma.course.findMany({
      where: { studyPlanId: group.studyPlanId },
      orderBy: { name: 'asc' },
      include: {
        school: true,
        subject: true,
        teacher: { include: { user: true } },
        studyPlan: { include: { gradeMetric: true } },
        grades: { include: { studentGrades: { include: { student: true } } } },
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
