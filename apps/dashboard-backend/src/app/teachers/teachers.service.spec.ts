import { Test, TestingModule } from '@nestjs/testing';
import { TeachersService } from './teachers.service';

describe('TeachersService', () => {
  let service: TeachersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeachersService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(TeachersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
