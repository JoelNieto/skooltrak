import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentsService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(StudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
