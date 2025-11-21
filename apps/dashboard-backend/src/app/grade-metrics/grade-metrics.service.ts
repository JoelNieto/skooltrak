import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GradeMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.gradeMetric.findMany();
  }

  findOne(id: string) {
    return this.prisma.gradeMetric.findUnique({ where: { id } });
  }
}
