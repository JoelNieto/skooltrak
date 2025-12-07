import { Inject, Injectable } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateTeacherInput } from './dto/create-teacher.input';
import { UpdateTeacherInput } from './dto/update-teacher.input';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {
    //this.initColors();
  }
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
        color: this.getRandomPastelColor(),
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

  async initColors() {
    const users = await this.prisma.user.findMany();
    const update = users.map((user) => {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { color: this.getRandomPastelColor() },
      });
    });

    await Promise.all(update);
  }

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search, orderBy, orderDirection } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.teacher.findMany({
      where: {
        organizationId,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { fatherName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
      include: { user: true },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'createdAt']: orderDirection,
      },
    });
  }

  findManyByOrganizationId(organizationId: string) {
    return this.prisma.teacher.findMany({
      where: { organizationId },
      include: { user: true },
    });
  }

  findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, color: true } },
        classGroups: true,
        courses: true,
        assignments: true,
        subjects: true,
      },
    });
  }

  findCount(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.teacher.count({
      where: {
        organizationId,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { fatherName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
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
