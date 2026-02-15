import { Args, Query, Resolver } from '@nestjs/graphql';
import { HabitMetric } from './entities/habit-metric.entity';
import { HabitMetricsService } from './habit-metrics.service';

@Resolver(() => HabitMetric)
export class HabitMetricsResolver {
  constructor(private readonly habitMetricsService: HabitMetricsService) {}

  @Query(() => [HabitMetric], { name: 'habitMetrics' })
  findAll() {
    return this.habitMetricsService.findAll();
  }

  @Query(() => HabitMetric, { name: 'habitMetric' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.habitMetricsService.findOne(id);
  }
}
