import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createSchoolInput: CreateSchoolInput) {
    return this.prisma.school.create({
      data: createSchoolInput,
    });
  }

  findAll() {
    return this.prisma.school.findMany();
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
