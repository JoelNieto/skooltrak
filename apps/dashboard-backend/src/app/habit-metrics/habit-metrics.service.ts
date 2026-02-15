import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HabitMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.habitMetric.findMany({
      orderBy: { order: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.habitMetric.findUnique({ where: { id } });
  }
}
