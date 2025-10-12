import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTeacherInput } from './dto/create-teacher.input';
import { UpdateTeacherInput } from './dto/update-teacher.input';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}
  create(createTeacherInput: CreateTeacherInput) {
    return this.prisma.teacher.create({ data: createTeacherInput });
  }

  findAll() {
    return this.prisma.teacher.findMany();
  }

  findOne(id: string) {
    return this.prisma.teacher.findUnique({ where: { id } });
  }

  update(id: string, updateTeacherInput: UpdateTeacherInput) {
    return this.prisma.teacher.update({
      where: { id },
      data: updateTeacherInput,
    });
  }

  remove(id: string) {
    return this.prisma.teacher.delete({ where: { id } });
  }
}
