import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { HabitEvaluationsController } from './habit-evaluations.controller';
import { HabitEvaluationsResolver } from './habit-evaluations.resolver';
import { HabitEvaluationsService } from './habit-evaluations.service';

@Module({
  controllers: [HabitEvaluationsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [HabitEvaluationsResolver] : []),
    HabitEvaluationsService,
  ],
  imports: [PrismaModule],
})
export class HabitEvaluationsModule {}
