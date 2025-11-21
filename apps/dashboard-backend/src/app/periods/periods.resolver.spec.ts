import { Test, TestingModule } from '@nestjs/testing';
import { PeriodsResolver } from './periods.resolver';
import { PeriodsService } from './periods.service';

describe('PeriodsResolver', () => {
  let resolver: PeriodsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PeriodsResolver, PeriodsService],
    }).compile();

    resolver = module.get<PeriodsResolver>(PeriodsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
