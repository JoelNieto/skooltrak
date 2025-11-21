import { Test, TestingModule } from '@nestjs/testing';
import { GradeMetricsResolver } from './grade-metrics.resolver';
import { GradeMetricsService } from './grade-metrics.service';

describe('GradeMetricsResolver', () => {
  let resolver: GradeMetricsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeMetricsResolver, GradeMetricsService],
    }).compile();

    resolver = module.get<GradeMetricsResolver>(GradeMetricsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
