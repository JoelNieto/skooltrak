import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateClassGroupInput } from './dto/create-class-group.input';
import { UpdateClassGroupInput } from './dto/update-class-group.input';

@Injectable()
export class ClassGroupsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createClassGroupInput: CreateClassGroupInput) {
    return this.prisma.classGroup.create({
      data: createClassGroupInput,
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, schoolId, search, studyPlanId } = fetchDataInput;
    let where: Prisma.ClassGroupWhereInput = {
      schoolId,
      studyPlanId,
    };
    if (search) {
      where = {
        ...where,
        OR: [{ name: { contains: search, mode: 'insensitive' } }],
      };
    }
    return this.prisma.classGroup.findMany({
      include: {
        teacher: true,
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
      where,
      skip,
      take,
    });
  }

  count(fetchDataInput: FetchDataInput) {
    const { schoolId, search, studyPlanId } = fetchDataInput;
    let where: Prisma.ClassGroupWhereInput = {
      schoolId,
      studyPlanId,
    };
    if (search) {
      where = {
        ...where,
        OR: [{ name: { contains: search, mode: 'insensitive' } }],
      };
    }
    return this.prisma.classGroup.count({ where });
  }

  findAllByOrganizationId(organizationId: string) {
    return this.prisma.classGroup.findMany({
      where: { organizationId },
      include: {
        teacher: true,
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
    });
  }

  findAllBySchoolId(schoolId: string) {
    return this.prisma.classGroup.findMany({
      where: { schoolId },
      include: {
        teacher: true,
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
    });
  }

  async findAllByCourseId(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { studyPlanId: true },
    });
    if (!course) return [];
    return this.prisma.classGroup.findMany({
      where: { studyPlanId: course.studyPlanId },
      include: {
        teacher: true,
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        students: {
          include: { user: true },
          orderBy: { firstName: 'asc' },
        },
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
    });
    if (!classGroup) return null;

    // Fetch courses via studyPlan
    const courses = await this.prisma.course.findMany({
      where: { studyPlanId: classGroup.studyPlanId },
      include: { teacher: true, subject: true },
      orderBy: { subject: { name: 'asc' } },
    });

    return { ...classGroup, courses };
  }

  update(id: string, updateClassGroupInput: UpdateClassGroupInput) {
    const { name, studyPlanId, teacherId, active, organizationId, schoolId } =
      updateClassGroupInput;

    const data: Prisma.ClassGroupUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (active !== undefined) data.active = active;
    if (studyPlanId !== undefined) {
      data.studyPlan = { connect: { id: studyPlanId } };
    }
    if (teacherId !== undefined) {
      data.teacher = teacherId ? { connect: { id: teacherId } } : { disconnect: true };
    }
    if (organizationId !== undefined) {
      data.organization = { connect: { id: organizationId } };
    }
    if (schoolId !== undefined) {
      data.school = { connect: { id: schoolId } };
    }

    return this.prisma.classGroup.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.classGroup.delete({ where: { id } });
  }
}
