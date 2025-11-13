import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateGradeMetricInput } from './dto/create-grade-metric.input';
import { UpdateGradeMetricInput } from './dto/update-grade-metric.input';
import { GradeMetric } from './entities/grade-metric.entity';
import { GradeMetricsService } from './grade-metrics.service';

@Resolver(() => GradeMetric)
export class GradeMetricsResolver {
  constructor(private readonly gradeMetricsService: GradeMetricsService) {}

  @Mutation(() => GradeMetric)
  createGradeMetric(
    @Args('createGradeMetricInput')
    createGradeMetricInput: CreateGradeMetricInput
  ) {
    return this.gradeMetricsService.create(createGradeMetricInput);
  }

  @Query(() => [GradeMetric], { name: 'gradeMetrics' })
  findAll() {
    return this.gradeMetricsService.findAll();
  }

  @Query(() => GradeMetric, { name: 'gradeMetric' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.gradeMetricsService.findOne(id);
  }

  @Mutation(() => GradeMetric)
  updateGradeMetric(
    @Args('updateGradeMetricInput')
    updateGradeMetricInput: UpdateGradeMetricInput
  ) {
    return this.gradeMetricsService.update(
      updateGradeMetricInput.id,
      updateGradeMetricInput
    );
  }

  @Mutation(() => GradeMetric)
  removeGradeMetric(@Args('id', { type: () => String }) id: string) {
    return this.gradeMetricsService.remove(id);
  }
}
