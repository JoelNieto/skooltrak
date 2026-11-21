import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';

describe('SubjectsService', () => {
  let service: SubjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubjectsService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(SubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
