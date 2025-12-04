import { Inject, Injectable } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
@Injectable()
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}

  create(createSubjectInput: CreateSubjectInput) {
    return this.prisma.subject.create({
      data: createSubjectInput,
      include: { organization: true },
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, orderBy, orderDirection } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.subject.findMany({
      where: { organizationId },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'name']: orderDirection,
      },
    });
  }

  findCount() {
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.subject.count({
      where: { organizationId },
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
