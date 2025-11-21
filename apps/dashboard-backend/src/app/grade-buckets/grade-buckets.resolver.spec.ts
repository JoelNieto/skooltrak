import { Test, TestingModule } from '@nestjs/testing';
import { GradeBucketsResolver } from './grade-buckets.resolver';
import { GradeBucketsService } from './grade-buckets.service';

describe('GradeBucketsResolver', () => {
  let resolver: GradeBucketsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeBucketsResolver, GradeBucketsService],
    }).compile();

    resolver = module.get<GradeBucketsResolver>(GradeBucketsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
