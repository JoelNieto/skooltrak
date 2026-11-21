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
    const notify = jest.spyOn(service, 'notifyPublished').mockResolvedValue(undefined as never);
    return { service, prisma, notify };
  }

  it('notifies families and stamps the publisher when a draft grade is published (BR-ASM-001.9)', async () => {
    const { service, prisma, notify } = build(false);
    await service.update('GR1', { id: 'GR1', published: true }, 'u-teacher');
    expect(notify).toHaveBeenCalledWith('GR1');
    const { data } = prisma.grade.update.mock.calls[0][0];
    expect(data).toMatchObject({ published: true, publishedById: 'u-teacher' });
    expect(data.publishedAt).toBeInstanceOf(Date);
  });

  it('does not notify or restamp when an already published grade is updated', async () => {
    const { service, prisma, notify } = build(true);
    await service.update('GR1', { id: 'GR1', title: 'Quiz 2', published: true }, 'u-teacher');
    expect(notify).not.toHaveBeenCalled();
    expect(prisma.grade.update.mock.calls[0][0].data).not.toHaveProperty('publishedAt');
  });

  it('clears the stamp and notifies no one when unpublished', async () => {
    const { service, prisma, notify } = build(true);
    await service.update('GR1', { id: 'GR1', published: false }, 'u-admin');
    expect(notify).not.toHaveBeenCalled();
    expect(prisma.grade.update.mock.calls[0][0].data).toMatchObject({ publishedAt: null, publishedById: null });
  });
});
