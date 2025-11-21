import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradeMetricsResolver } from './grade-metrics.resolver';
import { GradeMetricsService } from './grade-metrics.service';

@Module({
  providers: [GradeMetricsResolver, GradeMetricsService],
  imports: [PrismaModule],
})
export class GradeMetricsModule {}
