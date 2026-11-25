import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { PeriodsService } from './periods.service';

const d = (day: string) => new Date(`${day}T12:00:00.000Z`);
const t1 = { id: 'p1', year: 2026, name: 'Primer trimestre', shortName: 'T1', startDate: d('2026-03-01'), endDate: d('2026-05-31') };

function setup() {
  const prisma = {
    period: { findUnique: jest.fn(async ({ where }: { where: { id: string } }) => (where.id === 'p1' ? t1 : null)) },
    schoolPeriod: {
      upsert: jest.fn(async ({ create }: { create: Record<string, unknown> }) => {
        const { name, shortName, startDate, endDate } = create;
        return { name, shortName, startDate, endDate };
      }),
      deleteMany: jest.fn(async () => ({ count: 1 })),
    },
  };
  return { prisma, service: new PeriodsService(prisma as never) };
}

describe('PeriodsService school overrides', () => {
  it('stores only the fields that differ from the global period', async () => {
    const { prisma, service } = setup();
    const result = await service.setOverride('SCH1', 'p1', {
      name: '  Primer bimestre ',
      shortName: 'T1',
      startDate: d('2026-03-01'),
      endDate: d('2026-04-30'),
    });
    expect(prisma.schoolPeriod.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId_periodId: { schoolId: 'SCH1', periodId: 'p1' } },
        create: { schoolId: 'SCH1', periodId: 'p1', name: 'Primer bimestre', shortName: null, startDate: null, endDate: d('2026-04-30') },
      }),
    );
    expect(result).toMatchObject({
      name: 'Primer bimestre',
      shortName: 'T1',
      endDate: d('2026-04-30'),
      overridden: true,
      defaults: { name: 'Primer trimestre', endDate: d('2026-05-31') },
    });
  });

  it('removes the override when nothing differs', async () => {
    const { prisma, service } = setup();
    const result = await service.setOverride('SCH1', 'p1', { name: 'Primer trimestre', shortName: '', startDate: null });
    expect(prisma.schoolPeriod.upsert).not.toHaveBeenCalled();
    expect(prisma.schoolPeriod.deleteMany).toHaveBeenCalledWith({ where: { schoolId: 'SCH1', periodId: 'p1' } });
    expect(result).toMatchObject({ overridden: false, override: null });
  });

  it('rejects effective dates out of order', async () => {
    const { service } = setup();
    await expect(service.setOverride('SCH1', 'p1', { startDate: d('2026-06-15') })).rejects.toThrow(BadRequestException);
  });

  it('404s for an unknown period', async () => {
    const { service } = setup();
    await expect(service.setOverride('SCH1', 'nope', {})).rejects.toThrow(NotFoundException);
    await expect(service.clearOverride('SCH1', 'nope')).rejects.toThrow(NotFoundException);
  });
});
