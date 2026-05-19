import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { HabitEvaluationsController } from './habit-evaluations.controller';
import { HabitEvaluationsService } from './habit-evaluations.service';

@Module({
  controllers: [HabitEvaluationsController],
  providers: [
    HabitEvaluationsService,
  ],
  imports: [PrismaModule],
})
export class HabitEvaluationsModule {}
