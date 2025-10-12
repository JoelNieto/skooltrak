import { Test, TestingModule } from '@nestjs/testing';
import { ClassGroupsResolver } from './class-groups.resolver';
import { ClassGroupsService } from './class-groups.service';

describe('ClassGroupsResolver', () => {
  let resolver: ClassGroupsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassGroupsResolver, ClassGroupsService],
    }).compile();

    resolver = module.get<ClassGroupsResolver>(ClassGroupsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
