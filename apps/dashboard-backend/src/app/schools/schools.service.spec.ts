import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsService } from './schools.service';

describe('SchoolsService', () => {
  let service: SchoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // The constructor reads the R2 settings from ConfigService.
      providers: [SchoolsService, { provide: ConfigService, useValue: { get: () => undefined } }],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(SchoolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
