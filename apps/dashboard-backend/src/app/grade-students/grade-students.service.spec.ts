import { Test, TestingModule } from '@nestjs/testing';
import { GradeStudentsService } from './grade-students.service';

describe('GradeStudentsService', () => {
  let service: GradeStudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeStudentsService],
    }).compile();

    service = module.get<GradeStudentsService>(GradeStudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
