import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}
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

  findAll() {
    return this.prisma.student.findMany();
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
      include: { classGroup: true, courses: true },
    });
  }

  update(id: string, updateStudentInput: UpdateStudentInput) {
    return this.prisma.student.update({
      where: { id },
      data: updateStudentInput,
    });
  }

  async remove(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }
}
