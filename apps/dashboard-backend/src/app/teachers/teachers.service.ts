import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CreateTeacherInput } from './dto/create-teacher.input';
import { UpdateTeacherInput } from './dto/update-teacher.input';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTeacherInput: CreateTeacherInput) {
    const { email, ...rest } = createTeacherInput;
    const role = await this.prisma.role.findFirst({
      where: {
        organizationId: null,
        name: 'TEACHER',
      },
    });
    const user = await this.prisma.user.create({
      data: {
        firstName: rest.firstName,
        lastName: rest.fatherName,
        email: email,
        password: bcrypt.hashSync(rest.documentId, 10),
        organization: {
          connect: {
            id: createTeacherInput.organizationId,
          },
        },
        role: {
          connect: {
            id: role?.id,
          },
        },
      },
    });

    return this.prisma.teacher.create({
      data: {
        ...rest,
        userId: user.id,
      },
    });
  }

  findAll() {
    return this.prisma.teacher.findMany();
  }

  findManyByOrganizationId(organizationId: string) {
    return this.prisma.teacher.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, email: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        classGroups: true,
        courses: true,
        assignments: true,
      },
    });
  }

  update(id: string, updateTeacherInput: UpdateTeacherInput) {
    return this.prisma.teacher.update({
      where: { id },
      data: updateTeacherInput,
      include: { user: { select: { id: true, email: true } } },
    });
  }

  remove(id: string) {
    return this.prisma.teacher.delete({ where: { id } });
  }
}
