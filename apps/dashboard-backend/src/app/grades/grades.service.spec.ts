jest.mock('@/auth', () => ({ sendGradePublishedEmail: jest.fn() }));
jest.mock('@/shared', () => ({ TransformDateToNoon: () => () => undefined }));
jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { GradesService } from './grades.service';

describe('GradesService', () => {
  function build(published: boolean) {
    const prisma = {
      grade: {
        findUnique: jest.fn().mockResolvedValue({ published }),
        update: jest.fn().mockResolvedValue({ id: 'GR1' }),
      },
    };
    const service = new GradesService(prisma as never);
    const notify = jest.spyOn(service as never, 'sendGradePublishedNotifications').mockResolvedValue(undefined as never);
    return { service, prisma, notify };
  }

  it('notifies families when a draft grade is published', async () => {
    const { service, notify } = build(false);
    await service.update('GR1', { id: 'GR1', published: true });
    expect(notify).toHaveBeenCalledWith('GR1');
  });

  it('does not notify again when an already published grade is updated', async () => {
    const { service, notify } = build(true);
    await service.update('GR1', { id: 'GR1', title: 'Quiz 2', published: true });
    expect(notify).not.toHaveBeenCalled();
  });
});
