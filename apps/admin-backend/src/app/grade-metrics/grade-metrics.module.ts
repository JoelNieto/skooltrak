import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradeMetricsController } from './grade-metrics.controller';
import { GradeMetricsService } from './grade-metrics.service';

@Module({
  controllers: [GradeMetricsController],
  providers: [
    GradeMetricsService,
  ],
  imports: [PrismaModule],
})
export class GradeMetricsModule {}
