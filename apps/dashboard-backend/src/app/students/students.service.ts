import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Injectable({ scope: Scope.REQUEST })
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}
  async create(createStudentInput: CreateStudentInput) {
    const { email, organizationId, schoolId, classGroupId, ...rest } =
      createStudentInput;
    const role = await this.prisma.role.findFirstOrThrow({
      where: {
        organizationId: null,
        name: 'STUDENT',
      },
    });
    const user = await this.prisma.user.create({
      data: {
        firstName: rest.firstName,
        lastName: rest.fatherName,
        email: email,
        color: this.getRandomPastelColor(),
        password: bcrypt.hashSync(rest.documentId, 10),
        organizationId,
        roleId: role.id,
      },
    });

    const group = await this.prisma.classGroup.findUniqueOrThrow({
      where: {
        id: classGroupId,
      },
    });

    const courses = await this.prisma.course.findMany({
      where: {
        studyPlanId: group.studyPlanId,
      },
    });

    return this.prisma.student.create({
      data: {
        ...rest,
        userId: user.id,
        organizationId,
        schoolId,
        classGroupId,
        courses: {
          connect: courses.map((course) => ({ id: course.id })),
        },
      },
    });
  }

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search, orderBy, orderDirection } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.student.findMany({
      where: {
        organizationId,
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
      include: { classGroup: true, user: true },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'createdAt']: orderDirection,
      },
    });
  }

  getCount(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.student.count({
      where: {
        organizationId,
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
    });
  }

  findManyBySchoolId(schoolId: string) {
    return this.prisma.student.findMany({
      where: { schoolId },
      include: { classGroup: true, user: true },
    });
  }

  findManyByCourseId(courseId: string) {
    return this.prisma.student.findMany({
      where: { courses: { some: { id: courseId } } },
      include: { classGroup: true, user: true },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async getStudentsGrades(id: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        students: { some: { id } },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get all course IDs and their current period IDs
    const coursePeriodMap = new Map<string, string>();
    courses.forEach((course) => {
      if (course.currentPeriodId) {
        coursePeriodMap.set(course.id, course.currentPeriodId);
      }
    });

    if (coursePeriodMap.size === 0) {
      return courses.map((course) => ({
        ...course,
        grades: [],
      }));
    }

    // Fetch grades for all courses, filtered by published and current period
    const grades = await this.prisma.grade.findMany({
      where: {
        courseId: { in: Array.from(coursePeriodMap.keys()) },
        published: true,
        OR: Array.from(coursePeriodMap.entries()).map(
          ([courseId, periodId]) => ({
            courseId,
            periodId,
          })
        ),
      },
      include: {
        studentGrades: {
          where: {
            studentId: id,
          },
        },
        bucket: true,
        period: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group grades by courseId
    const gradesByCourse = new Map<string, typeof grades>();
    grades.forEach((grade) => {
      const existing = gradesByCourse.get(grade.courseId);
      if (existing) {
        existing.push(grade);
      } else {
        gradesByCourse.set(grade.courseId, [grade]);
      }
    });

    // Attach grades to courses
    return courses.map((course) => ({
      ...course,
      grades: gradesByCourse.get(course.id) || [],
    }));
  }

  findOne(id: string) {
    return this.prisma.student.findUniqueOrThrow({
      where: { id },
      include: {
        classGroup: {
          include: { studyPlan: { include: { gradeMetric: true } } },
        },
        courses: {
          include: { subject: true, teacher: { include: { user: true } } },
          orderBy: { subject: { name: 'asc' } },
        },
        user: true,
        studentGrades: {
          include: {
            grade: {
              include: {
                period: true,
                bucket: true,
                course: { include: { subject: true } },
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateStudentInput: UpdateStudentInput) {
    const { email, ...rest } = updateStudentInput;

    return await this.prisma.student.update({
      where: { id },
      data: rest,
    });
  }

  async remove(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }
}
