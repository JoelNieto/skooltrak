import { Prisma } from '@generated/prisma';

import { ConflictException, Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { DEFAULT_BUCKETS } from './default-buckets.constants';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';
@Injectable({ scope: Scope.REQUEST })
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {}

  /**
   * Generates a unique course code starting with 3 letters.
   * If the code already exists, it adds more letters until unique.
   */
  private async generateUniqueCode(schoolId: string, baseName: string): Promise<string> {
    // Remove non-alphabetic characters and convert to uppercase
    const cleanName = baseName.replace(/[^a-zA-Z]/g, '').toUpperCase();

    // Start with 3 letters minimum
    for (let length = 3; length <= cleanName.length; length++) {
      const code = cleanName.substring(0, length);

      const existing = await this.prisma.course.findUnique({
        where: {
          schoolId_code: { schoolId, code },
        },
      });

      if (!existing) {
        return code;
      }
    }

    // If all substrings are taken, append a number
    let counter = 1;
    while (true) {
      const code = `${cleanName.substring(0, 3)}${counter}`;
      const existing = await this.prisma.course.findUnique({
        where: {
          schoolId_code: { schoolId, code },
        },
      });

      if (!existing) {
        return code;
      }
      counter++;
    }
  }

  async create(createCourseInput: CreateCourseInput) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: createCourseInput.subjectId },
    });
    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id: createCourseInput.studyPlanId },
    });

    // Use provided code or generate a unique one from subject name
    const code = createCourseInput.code
      ? createCourseInput.code
      : await this.generateUniqueCode(createCourseInput.schoolId, subject?.name ?? 'CRS');

    let course;
    try {
      course = await this.prisma.course.create({
        data: {
          ...createCourseInput,
          shortName: createCourseInput.shortName
            ? `${createCourseInput.shortName}`
            : `${subject?.code} - ${studyPlan?.shortName}`,
          name: createCourseInput.name ? `${createCourseInput.name}` : `${subject?.name} - ${studyPlan?.name}`,
          code,
          gradeBuckets: {
            createMany: {
              data: DEFAULT_BUCKETS.map((bucket) => ({
                name: bucket.name,
                weight: bucket.weighting,
              })),
            },
          },
        },
        include: { school: true, subject: true, studyPlan: true },
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
        throw new ConflictException(
          `Ya existe un curso con la asignatura "${subject?.name}" en el plan "${studyPlan?.name}"`,
        );
      }
      throw error;
    }

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
    const [courses, targetStudyPlan] = await Promise.all([
      this.prisma.course.findMany({
        where: { studyPlanId: sourceStudyPlanId },
        include: { subject: true },
      }),
      this.prisma.studyPlan.findUnique({
        where: { id: targetStudyPlanId },
      }),
    ]);

    if (!targetStudyPlan) {
      throw new ConflictException('Target study plan not found');
    }

    const createdCourses = [];
    for (const course of courses) {
      const code = await this.generateUniqueCode(course.schoolId, course.subject.name);

      const newCourse = await this.prisma.course.create({
        data: {
          name: `${course.subject.name} - ${targetStudyPlan.name}`,
          code,
          shortName: `${course.subject.code} - ${targetStudyPlan.shortName}`,
          organizationId: course.organizationId,
          schoolId: course.schoolId,
          subjectId: course.subjectId,
          studyPlanId: targetStudyPlanId,
        },
      });
      createdCourses.push(newCourse);
    }

    return { count: createdCourses.length };
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
