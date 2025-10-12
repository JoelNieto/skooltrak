import { Test, TestingModule } from '@nestjs/testing';
import { ClassGroupsService } from './class-groups.service';

describe('ClassGroupsService', () => {
  let service: ClassGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassGroupsService],
    }).compile();

    service = module.get<ClassGroupsService>(ClassGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
