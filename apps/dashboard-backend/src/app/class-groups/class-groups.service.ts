import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClassGroupInput } from './dto/create-class-group.input';
import { UpdateClassGroupInput } from './dto/update-class-group.input';

@Injectable()
export class ClassGroupsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createClassGroupInput: CreateClassGroupInput) {
    return this.prisma.classGroup.create({ data: createClassGroupInput });
  }

  findAll() {
    return this.prisma.classGroup.findMany();
  }

  findOne(id: string) {
    return this.prisma.classGroup.findUnique({ where: { id } });
  }

  update(id: string, updateClassGroupInput: UpdateClassGroupInput) {
    return this.prisma.classGroup.update({
      where: { id },
      data: updateClassGroupInput,
    });
  }

  remove(id: string) {
    return this.prisma.classGroup.delete({ where: { id } });
  }
}
