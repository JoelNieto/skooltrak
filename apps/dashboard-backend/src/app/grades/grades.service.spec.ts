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

  describe('create (ASM-001-S06)', () => {
    function buildCreate(error?: unknown) {
      const prisma = {
        student: { findMany: jest.fn().mockResolvedValue([{ id: 'S1' }]) },
        grade: {
          create: jest.fn(async ({ data }) => {
            if (error) throw error;
            return { id: 'GR1', published: !!data.published, ...data };
          }),
        },
      };
      const service = new GradesService(prisma as never);
      const notify = jest.spyOn(service, 'notifyPublished').mockResolvedValue(undefined as never);
      return { service, prisma, notify };
    }
    const input = { title: 'Tarea', courseId: 'C1', bucketId: 'B1', periodId: 'P1', date: new Date('2026-11-01') };

    it("takes the linked assignment's title and date @BR-ASM-001.11", async () => {
      const { service, prisma } = buildCreate();
      const date = new Date('2026-11-20');
      await service.create({ ...input, assignmentId: 'A1' }, 'u-teacher', { title: 'Proyecto', date });
      expect(prisma.grade.create.mock.calls[0][0].data).toMatchObject({ assignmentId: 'A1', title: 'Proyecto', date });
    });

    it('stamps and notifies a column created already published @BR-ASM-001.9', async () => {
      const { service, prisma, notify } = buildCreate();
      await service.create({ ...input, published: true }, 'u-teacher');
      expect(prisma.grade.create.mock.calls[0][0].data).toMatchObject({ publishedById: 'u-teacher' });
      expect(notify).toHaveBeenCalledWith('GR1');
    });

    it('does not notify for a draft', async () => {
      const { service, notify } = buildCreate();
      await service.create(input, 'u-teacher');
      expect(notify).not.toHaveBeenCalled();
    });

    it('turns a concurrent second link into 409', async () => {
      const { Prisma } = jest.requireActual('@generated/prisma');
      const race = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'x' });
      const { service } = buildCreate(race);
      await expect(service.create({ ...input, assignmentId: 'A1' }, 'u-teacher', { title: 'P', date: new Date() })).rejects.toThrow(
        'Esta asignación ya tiene una calificación',
      );
    });
  });
});

