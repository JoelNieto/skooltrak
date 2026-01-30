import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateParentInput } from './dto/create-parent.input';
import { UpdateParentInput } from './dto/update-parent.input';

@Injectable({ scope: Scope.REQUEST })
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}

  async create(createParentInput: CreateParentInput) {
    const { studentIds, ...rest } = createParentInput;

    return this.prisma.parent.create({
      data: {
        ...rest,
        students: studentIds?.length
          ? { connect: studentIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { students: true },
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search, orderBy, orderDirection } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;

    return this.prisma.parent.findMany({
      where: {
        organizationId,
        OR: search
          ? [
              { firstName: { contains: search, mode: 'insensitive' } },
              { fatherName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { documentId: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { students: { include: { user: true } } },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'createdAt']: orderDirection ?? 'desc',
      },
    });
  }

  getCount(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;

    return this.prisma.parent.count({
      where: {
        organizationId,
        OR: search
          ? [
              { firstName: { contains: search, mode: 'insensitive' } },
              { fatherName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { documentId: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.parent.findUniqueOrThrow({
      where: { id },
      include: {
        students: {
          include: { user: true, classGroup: true },
        },
      },
    });
  }

  findByStudentId(studentId: string) {
    return this.prisma.parent.findMany({
      where: {
        students: { some: { id: studentId } },
      },
      include: { students: true },
    });
  }

  async update(id: string, updateParentInput: UpdateParentInput) {
    const { studentIds, ...rest } = updateParentInput;

    // If studentIds is provided, update the relationship
    if (studentIds !== undefined) {
      return this.prisma.parent.update({
        where: { id },
        data: {
          ...rest,
          students: {
            set: studentIds.map((studentId) => ({ id: studentId })),
          },
        },
        include: { students: true },
      });
    }

    return this.prisma.parent.update({
      where: { id },
      data: rest,
      include: { students: true },
    });
  }

  remove(id: string) {
    return this.prisma.parent.delete({ where: { id } });
  }
}
