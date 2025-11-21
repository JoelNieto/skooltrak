import { Args, Query, Resolver } from '@nestjs/graphql';
import { GradeMetric } from './entities/grade-metric.entity';
import { GradeMetricsService } from './grade-metrics.service';

@Resolver(() => GradeMetric)
export class GradeMetricsResolver {
  constructor(private readonly gradeMetricsService: GradeMetricsService) {}

  @Query(() => [GradeMetric], { name: 'gradeMetrics' })
  findAll() {
    return this.gradeMetricsService.findAll();
  }

  @Query(() => GradeMetric, { name: 'gradeMetric' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.gradeMetricsService.findOne(id);
  }
}
