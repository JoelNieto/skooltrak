import { Test, TestingModule } from '@nestjs/testing';
import { GroupsSchedulesResolver } from './groups-schedules.resolver';
import { GroupsSchedulesService } from './groups-schedules.service';

describe('GroupsSchedulesResolver', () => {
  let resolver: GroupsSchedulesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsSchedulesResolver, GroupsSchedulesService],
    }).compile();

    resolver = module.get<GroupsSchedulesResolver>(GroupsSchedulesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
