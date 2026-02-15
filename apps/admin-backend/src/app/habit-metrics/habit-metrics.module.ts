import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { HabitMetricsResolver } from './habit-metrics.resolver';
import { HabitMetricsService } from './habit-metrics.service';

@Module({
  providers: [HabitMetricsResolver, HabitMetricsService],
  imports: [PrismaModule],
})
export class HabitMetricsModule {}
