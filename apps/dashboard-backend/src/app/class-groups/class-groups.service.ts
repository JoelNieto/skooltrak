import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClassGroupInput } from './dto/create-class-group.input';
import { UpdateClassGroupInput } from './dto/update-class-group.input';

@Injectable()
export class ClassGroupsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createClassGroupInput: CreateClassGroupInput) {
    const coursesToConnect = await this.prisma.course.findMany({
      where: {
        studyPlanId: createClassGroupInput.studyPlanId,
        schoolId: createClassGroupInput.schoolId,
      },
      select: { id: true },
    });
    return this.prisma.classGroup.create({
      data: {
        ...createClassGroupInput,
        courses: { connect: coursesToConnect.map((c) => ({ id: c.id })) },
      },
    });
  }

  findAll() {
    return this.prisma.classGroup.findMany();
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

  findAllByCourseId(courseId: string) {
    return this.prisma.classGroup.findMany({
      where: { courses: { some: { id: courseId } } },
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
    return this.prisma.classGroup.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        students: {
          include: { user: true },
          orderBy: { user: { firstName: 'asc' } },
        },
        courses: {
          include: { teacher: true, subject: true },
          orderBy: { subject: { name: 'asc' } },
        },
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
    });
  }

  update(id: string, updateClassGroupInput: UpdateClassGroupInput) {
    return this.prisma.classGroup.update({
      where: { id },
      data: updateClassGroupInput,
    });
  }

  remove(id: string) {
    return this.prisma.classGroup.delete({ where: { id } });
  }
}
