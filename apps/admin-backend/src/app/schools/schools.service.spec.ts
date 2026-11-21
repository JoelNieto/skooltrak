import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsService } from './schools.service';

describe('SchoolsService', () => {
  let service: SchoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolsService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(SchoolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
