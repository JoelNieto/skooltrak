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
    });
  }

  /** Newest year first; within a year, by start date. `_count.schoolOverrides`: schools that adjusted it. */
  findAll() {
    return this.prisma.period.findMany({
      orderBy: [{ year: 'desc' }, { startDate: 'asc' }],
      include: { _count: { select: { schoolOverrides: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.period.findUnique({
      where: { id },
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
