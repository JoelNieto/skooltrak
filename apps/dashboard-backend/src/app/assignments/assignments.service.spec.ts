import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignmentsService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
