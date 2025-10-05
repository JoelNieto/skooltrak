import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createSubjectInput: CreateSubjectInput) {
    return this.prisma.subject.create({
      data: createSubjectInput,
      include: { school: true },
    });
  }

  findAll() {
    return this.prisma.subject.findMany({ include: { school: true } });
  }

  findOne(id: string) {
    return this.prisma.subject.findUnique({
      where: { id },
      include: { school: true },
    });
  }

  update(id: string, updateSubjectInput: UpdateSubjectInput) {
    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectInput,
      include: { school: true },
    });
  }

  remove(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}
