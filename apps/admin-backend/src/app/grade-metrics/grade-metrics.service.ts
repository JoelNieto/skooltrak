import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGradeMetricInput } from './dto/create-grade-metric.input';
import { UpdateGradeMetricInput } from './dto/update-grade-metric.input';

@Injectable()
export class GradeMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createGradeMetricInput: CreateGradeMetricInput) {
    return this.prisma.gradeMetric.create({
      data: createGradeMetricInput,
    });
  }

  findAll() {
    return this.prisma.gradeMetric.findMany();
  }

  findOne(id: string) {
    return this.prisma.gradeMetric.findUnique({ where: { id } });
  }

  update(id: string, updateGradeMetricInput: UpdateGradeMetricInput) {
    return this.prisma.gradeMetric.update({
      where: { id },
      data: updateGradeMetricInput,
    });
  }

  remove(id: string) {
    return this.prisma.gradeMetric.delete({ where: { id } });
  }
}
