import { Test, TestingModule } from '@nestjs/testing';
import { GroupsSchedulesService } from './groups-schedules.service';

describe('GroupsSchedulesService', () => {
  let service: GroupsSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsSchedulesService],
    }).compile();

    service = module.get<GroupsSchedulesService>(GroupsSchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
