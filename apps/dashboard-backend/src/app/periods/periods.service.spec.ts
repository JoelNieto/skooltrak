import { Test, TestingModule } from '@nestjs/testing';
import { PeriodsService } from './periods.service';

describe('PeriodsService', () => {
  let service: PeriodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PeriodsService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(PeriodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
