import { BetterAuthGuard } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SaveHabitEvaluationInput } from './dto/save-habit-evaluation.input';
import { HabitEvaluation } from './entities/habit-evaluation.entity';
import { HabitEvaluationsService } from './habit-evaluations.service';

@UseGuards(BetterAuthGuard)
@Resolver(() => HabitEvaluation)
export class HabitEvaluationsResolver {
  constructor(
    private readonly habitEvaluationsService: HabitEvaluationsService
  ) {}

  @Mutation(() => HabitEvaluation)
  saveHabitEvaluation(
    @Args('saveHabitEvaluationInput')
    saveHabitEvaluationInput: SaveHabitEvaluationInput
  ) {
    return this.habitEvaluationsService.save(saveHabitEvaluationInput);
  }

  @Query(() => [HabitEvaluation], { name: 'habitEvaluationsByGroup' })
  findByGroup(
    @Args('classGroupId', { type: () => String }) classGroupId: string,
    @Args('periodId', { type: () => String }) periodId: string
  ) {
    return this.habitEvaluationsService.findByGroup(classGroupId, periodId);
  }

  @Query(() => HabitEvaluation, { name: 'habitEvaluation' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.habitEvaluationsService.findOne(id);
  }
}
