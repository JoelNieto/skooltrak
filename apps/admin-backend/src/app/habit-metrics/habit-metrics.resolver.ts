import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateHabitMetricInput } from './dto/create-habit-metric.input';
import { UpdateHabitMetricInput } from './dto/update-habit-metric.input';
import { HabitMetric } from './entities/habit-metric.entity';
import { HabitMetricsService } from './habit-metrics.service';

@Resolver(() => HabitMetric)
export class HabitMetricsResolver {
  constructor(private readonly habitMetricsService: HabitMetricsService) {}

  @Mutation(() => HabitMetric)
  createHabitMetric(
    @Args('createHabitMetricInput')
    createHabitMetricInput: CreateHabitMetricInput
  ) {
    return this.habitMetricsService.create(createHabitMetricInput);
  }

  @Query(() => [HabitMetric], { name: 'habitMetrics' })
  findAll() {
    return this.habitMetricsService.findAll();
  }

  @Query(() => HabitMetric, { name: 'habitMetric' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.habitMetricsService.findOne(id);
  }

  @Mutation(() => HabitMetric)
  updateHabitMetric(
    @Args('updateHabitMetricInput')
    updateHabitMetricInput: UpdateHabitMetricInput
  ) {
    return this.habitMetricsService.update(
      updateHabitMetricInput.id,
      updateHabitMetricInput
    );
  }

  @Mutation(() => HabitMetric)
  removeHabitMetric(@Args('id', { type: () => String }) id: string) {
    return this.habitMetricsService.remove(id);
  }
}
