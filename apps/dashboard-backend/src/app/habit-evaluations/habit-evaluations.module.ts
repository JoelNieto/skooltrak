import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { HabitEvaluationsResolver } from './habit-evaluations.resolver';
import { HabitEvaluationsService } from './habit-evaluations.service';

@Module({
  providers: [HabitEvaluationsResolver, HabitEvaluationsService],
  imports: [PrismaModule],
})
export class HabitEvaluationsModule {}
