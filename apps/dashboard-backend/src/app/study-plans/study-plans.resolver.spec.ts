import { Test, TestingModule } from '@nestjs/testing';
import { StudyPlansResolver } from './study-plans.resolver';
import { StudyPlansService } from './study-plans.service';

describe('StudyPlansResolver', () => {
  let resolver: StudyPlansResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudyPlansResolver, StudyPlansService],
    }).compile();

    resolver = module.get<StudyPlansResolver>(StudyPlansResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
