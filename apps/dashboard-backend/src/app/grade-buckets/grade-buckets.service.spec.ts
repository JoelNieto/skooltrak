import { Test, TestingModule } from '@nestjs/testing';
import { GradeBucketsService } from './grade-buckets.service';

describe('GradeBucketsService', () => {
  let service: GradeBucketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeBucketsService],
    }).compile();

    service = module.get<GradeBucketsService>(GradeBucketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
