import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateHabitMetricInput } from './dto/create-habit-metric.input';
import { UpdateHabitMetricInput } from './dto/update-habit-metric.input';

@Injectable()
export class HabitMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createHabitMetricInput: CreateHabitMetricInput) {
    return this.prisma.habitMetric.create({
      data: createHabitMetricInput,
    });
  }

  findAll() {
    return this.prisma.habitMetric.findMany({
      orderBy: { order: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.habitMetric.findUnique({ where: { id } });
  }

  update(id: string, updateHabitMetricInput: UpdateHabitMetricInput) {
    return this.prisma.habitMetric.update({
      where: { id },
      data: updateHabitMetricInput,
    });
  }

  remove(id: string) {
    return this.prisma.habitMetric.delete({ where: { id } });
  }
}
