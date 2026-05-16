import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { HabitMetricsController } from './habit-metrics.controller';
import { HabitMetricsResolver } from './habit-metrics.resolver';
import { HabitMetricsService } from './habit-metrics.service';

@Module({
  controllers: [HabitMetricsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [HabitMetricsResolver] : []),
    HabitMetricsService,
  ],
  imports: [PrismaModule],
})
export class HabitMetricsModule {}
