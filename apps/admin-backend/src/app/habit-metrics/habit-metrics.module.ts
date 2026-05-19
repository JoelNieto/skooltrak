import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { HabitMetricsController } from './habit-metrics.controller';
import { HabitMetricsService } from './habit-metrics.service';

@Module({
  controllers: [HabitMetricsController],
  providers: [
    HabitMetricsService,
  ],
  imports: [PrismaModule],
})
export class HabitMetricsModule {}
