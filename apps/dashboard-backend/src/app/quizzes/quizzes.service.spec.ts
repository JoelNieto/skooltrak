import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';

describe('QuizzesService', () => {
  let service: QuizzesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuizzesService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(QuizzesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
