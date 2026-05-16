import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradeMetricsController } from './grade-metrics.controller';
import { GradeMetricsResolver } from './grade-metrics.resolver';
import { GradeMetricsService } from './grade-metrics.service';

@Module({
  controllers: [GradeMetricsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [GradeMetricsResolver] : []),
    GradeMetricsService,
  ],
  imports: [PrismaModule],
})
export class GradeMetricsModule {}
