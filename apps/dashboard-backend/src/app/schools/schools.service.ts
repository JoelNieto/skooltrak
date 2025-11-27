import { Inject, Injectable } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}
  create(createSchoolInput: CreateSchoolInput) {
    return this.prisma.school.create({ data: createSchoolInput });
  }

  findAll() {
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.school.findMany({ where: { organizationId } });
  }

  findOne(id: string) {
    return this.prisma.school.findUnique({ where: { id } });
  }

  update(id: string, updateSchoolInput: UpdateSchoolInput) {
    return this.prisma.school.update({
      where: { id },
      data: updateSchoolInput,
    });
  }

  remove(id: string) {
    return this.prisma.school.delete({ where: { id } });
  }
}
