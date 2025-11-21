import { Test, TestingModule } from '@nestjs/testing';
import { GradeStudentsResolver } from './grade-students.resolver';
import { GradeStudentsService } from './grade-students.service';

describe('GradeStudentsResolver', () => {
  let resolver: GradeStudentsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeStudentsResolver, GradeStudentsService],
    }).compile();

    resolver = module.get<GradeStudentsResolver>(GradeStudentsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
