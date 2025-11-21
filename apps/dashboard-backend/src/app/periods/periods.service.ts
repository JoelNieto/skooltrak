import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePeriodInput } from './dto/create-period.input';
import { UpdatePeriodInput } from './dto/update-period.input';

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPeriodInput: CreatePeriodInput) {
    return this.prisma.period.create({
      data: createPeriodInput,
      include: { school: true },
    });
  }

  findAll() {
    return this.prisma.period.findMany({ include: { school: true } });
  }

  findManyBySchoolId(schoolId: string) {
    return this.prisma.period.findMany({
      where: { schoolId, year: new Date().getFullYear() },
      include: { school: true },
    });
  }

  findOne(id: string) {
    return this.prisma.period.findUnique({
      where: { id },
      include: { school: true },
    });
  }

  update(id: string, updatePeriodInput: UpdatePeriodInput) {
    return this.prisma.period.update({
      where: { id },
      data: updatePeriodInput,
    });
  }

  remove(id: string) {
    return this.prisma.period.delete({ where: { id } });
  }
}
