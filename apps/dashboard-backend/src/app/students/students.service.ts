import { Inject, Injectable } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Injectable()
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

  findOne(id: string) {
    return this.prisma.student.findUniqueOrThrow({
      where: { id },
      include: { classGroup: true, courses: true, user: true },
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
