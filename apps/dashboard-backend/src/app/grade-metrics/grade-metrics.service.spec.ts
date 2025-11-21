import { Test, TestingModule } from '@nestjs/testing';
import { GradeMetricsService } from './grade-metrics.service';

describe('GradeMetricsService', () => {
  let service: GradeMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeMetricsService],
    }).compile();

    service = module.get<GradeMetricsService>(GradeMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
