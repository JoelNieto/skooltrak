import { Test, TestingModule } from '@nestjs/testing';
import { StudentGradesResolver } from './student-grades.resolver';
import { StudentGradesService } from './student-grades.service';

describe('StudentGradesResolver', () => {
  let resolver: StudentGradesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentGradesResolver, StudentGradesService],
    }).compile();

    resolver = module.get<StudentGradesResolver>(StudentGradesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
