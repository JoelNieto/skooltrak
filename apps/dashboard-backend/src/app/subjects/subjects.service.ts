import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
@Injectable({ scope: Scope.REQUEST })
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}

  create(createSubjectInput: CreateSubjectInput) {
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.subject.create({
      data: {
        ...createSubjectInput,
        organizationId,
      },
      include: { organization: true },
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, orderBy, orderDirection, search } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.subject.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'name']: orderDirection,
      },
    });
  }

  findCount(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.subject.count({
      where: {
        organizationId,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  findOne(id: string) {
    return this.prisma.subject.findUnique({
      where: { id },
    });
  }

  update(id: string, updateSubjectInput: UpdateSubjectInput) {
    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectInput,
    });
  }

  remove(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}
