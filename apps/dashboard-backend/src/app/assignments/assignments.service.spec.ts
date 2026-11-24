import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentChannelsService } from '../communication/assignment-channels.service';
import { PrismaService } from '../prisma.service';
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

/** COM-003-S02: every assignment gets its Q&A channel, and its dates move the close time. */
describe('AssignmentsService and its Q&A channel', () => {
  const prisma = {
    assignment: {
      create: jest.fn().mockResolvedValue({ id: 'a1' }),
      update: jest.fn().mockResolvedValue({ id: 'a1' }),
    },
  };
  const channels = { ensureFor: jest.fn().mockResolvedValue({ id: 'ch1' }), syncCloseTime: jest.fn() };
  const service = new AssignmentsService(
    prisma as unknown as PrismaService,
    channels as unknown as AssignmentChannelsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates the Q&A channel with the assignment @FR-COM-003.17', async () => {
    await service.create({ title: 'Fracciones', courseId: 'c1' } as never, 's1');
    expect(channels.ensureFor).toHaveBeenCalledWith('a1');
  });

  it('recomputes the close time when dates are added @FR-COM-003.18', async () => {
    await service.update('a1', { id: 'a1', groupDates: [{ date: new Date(), classGroupId: 'g1' }] } as never);
    expect(channels.syncCloseTime).toHaveBeenCalledWith('a1');
  });

  it('leaves the close time when no dates change', async () => {
    await service.update('a1', { id: 'a1', title: 'Otro título' } as never);
    expect(channels.syncCloseTime).not.toHaveBeenCalled();
  });
});
