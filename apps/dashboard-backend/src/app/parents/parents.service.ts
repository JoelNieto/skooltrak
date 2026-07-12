import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateParentInput } from './dto/create-parent.input';
import { UpdateParentInput } from './dto/update-parent.input';

@Injectable({ scope: Scope.REQUEST })
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async create(createParentInput: CreateParentInput) {
    const { studentIds, ...rest } = createParentInput;

    return this.prisma.parent.create({
      data: {
        ...rest,
        students: studentIds?.length ? { connect: studentIds.map((id) => ({ id })) } : undefined,
      },
      include: { students: true },
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search, orderBy, orderDirection } = fetchDataInput;
    const req = this.request;
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
    const req = this.request;
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

  /**
   * Returns all children of the authenticated parent across every Organization
   * they belong to (unified "My Children" view for federated parents).
   */
  getMyChildren(userId: string) {
    return this.prisma.parent.findMany({
      where: { userId },
      include: {
        students: {
          include: {
            user: true,
            classGroup: true,
            school: { select: { id: true, name: true, shortName: true, logo: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Updates the authenticated parent's own profile for a specific (per-org) Parent record.
   * Verifies ownership before applying changes.
   */
  async updateMyProfile(userId: string, parentId: string, data: Partial<UpdateParentInput>) {
    const parent = await this.prisma.parent.findFirstOrThrow({
      where: { id: parentId, userId },
    });

    const { studentIds, organizationId, userId: _u, id: _id, ...rest } = data as any;

    return this.prisma.parent.update({
      where: { id: parent.id },
      data: rest,
      include: { students: true },
    });
  }
}
