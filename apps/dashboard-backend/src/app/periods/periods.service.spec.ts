import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { PERIOD_IN_USE, PeriodsService, RESTORE_IN_USE } from './periods.service';

const d = (day: string) => new Date(`${day}T12:00:00.000Z`);

interface Row {
  id: string;
  year: number;
  name: string;
  shortName: string;
  startDate: Date;
  endDate: Date;
  schoolId: string | null;
}

/** In-memory periods plus the school's grades (periodId per grade). */
function setup(periods: Row[], grades: Array<{ periodId: string; schoolId: string }> = []) {
  let n = 0;
  const match = (r: Row, where: Record<string, unknown> = {}) =>
    Object.entries(where).every(([k, v]) => {
      if (k === 'OR') return (v as Record<string, unknown>[]).some((w) => match(r, w));
      if (k === 'id' && typeof v === 'object' && v) return (v as { in: string[] }).in.includes(r.id);
      return (r as unknown as Record<string, unknown>)[k] === v;
    });
  const pick = (r: Row) => r;
  const period = {
    findMany: jest.fn(async ({ where, orderBy }: { where?: Record<string, unknown>; orderBy?: unknown }) => {
      const found = periods.filter((r) => match(r, where)).map(pick);
      return orderBy ? found.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()) : found;
    }),
    findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) => periods.find((r) => match(r, where)) ?? null),
    count: jest.fn(async ({ where }: { where: Record<string, unknown> }) => periods.filter((r) => match(r, where)).length),
    create: jest.fn(async ({ data }: { data: Omit<Row, 'id'> }) => {
      const row = { id: `new-${++n}`, ...data };
      periods.push(row);
      return row;
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
      const row = periods.find((r) => r.id === where.id);
      return Object.assign(row ?? {}, data);
    }),
    delete: jest.fn(async ({ where }: { where: { id: string } }) => periods.splice(periods.findIndex((r) => r.id === where.id), 1)),
    deleteMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      for (const r of periods.filter((x) => match(x, where))) periods.splice(periods.indexOf(r), 1);
    }),
  };
  const grade = {
    updateMany: jest.fn(async ({ where, data }: { where: { periodId: string; course: { schoolId: string } }; data: { periodId: string } }) => {
      for (const g of grades) if (g.periodId === where.periodId && g.schoolId === where.course.schoolId) g.periodId = data.periodId;
    }),
    groupBy: jest.fn(async ({ where }: { where: { periodId: { in: string[] }; course: { schoolId: string } } }) => {
      const counts = new Map<string, number>();
      for (const g of grades)
        if (where.periodId.in.includes(g.periodId) && g.schoolId === where.course.schoolId)
          counts.set(g.periodId, (counts.get(g.periodId) ?? 0) + 1);
      return [...counts].map(([periodId, c]) => ({ periodId, _count: { _all: c } }));
    }),
  };
  const habitEvaluation = { updateMany: jest.fn(async () => ({})), groupBy: jest.fn(async () => []) };
  const prisma = { period, grade, habitEvaluation, $transaction: (fn: (tx: unknown) => unknown) => fn(prisma) };
  return { service: new PeriodsService(prisma as never), periods, grades };
}

const g1 = { id: 'g1', year: 2026, name: 'T1', shortName: 'T1', startDate: d('2026-03-01'), endDate: d('2026-05-31'), schoolId: null };
const g2 = { id: 'g2', year: 2026, name: 'T2', shortName: 'T2', startDate: d('2026-06-01'), endDate: d('2026-08-31'), schoolId: null };

describe('PeriodsService: a school on its own calendar', () => {
  it('customize copies the global periods and moves only this school’s grades onto the copies', async () => {
    const { service, grades } = setup([{ ...g1 }, { ...g2 }], [
      { periodId: 'g1', schoolId: 'SCH1' },
      { periodId: 'g1', schoolId: 'SCH2' },
    ]);
    const year = await service.customize('SCH1', 2026);
    expect(year.custom).toBe(true);
    expect(year.periods.map((p) => [p.name, p.custom, p.usage])).toEqual([
      ['T1', true, 1],
      ['T2', true, 0],
    ]);
    expect(grades).toEqual([
      { periodId: year.periods[0].id, schoolId: 'SCH1' },
      { periodId: 'g1', schoolId: 'SCH2' },
    ]);
    await expect(service.customize('SCH1', 2026)).rejects.toThrow(ConflictException);
  });

  it('adds periods across calendar years (Aug–Jun) and rejects overlaps', async () => {
    const { service } = setup([]);
    await service.createForSchool('SCH1', { year: 2026, name: 'Q1', startDate: d('2026-08-17'), endDate: d('2026-10-31') });
    const q2 = await service.createForSchool('SCH1', {
      year: 2026,
      name: ' Q2 ',
      shortName: 'Q2',
      startDate: d('2026-11-01'),
      endDate: d('2027-01-22'),
    });
    expect(q2).toMatchObject({ name: 'Q2', year: 2026, custom: true, endDate: d('2027-01-22') });
    await expect(
      service.createForSchool('SCH1', { year: 2026, name: 'Q3', startDate: d('2027-01-22'), endDate: d('2027-03-31') }),
    ).rejects.toThrow('El periodo se solapa con Q2');
    expect((await service.schoolYear('SCH1', 2026)).periods.map((p) => p.name)).toEqual(['Q1', 'Q2']);
  });

  it('the first own period of a year on global periods copies the globals first', async () => {
    const { service } = setup([{ ...g1 }, { ...g2 }]);
    await service.createForSchool('SCH1', { year: 2026, name: 'Verano', startDate: d('2026-09-01'), endDate: d('2026-09-30') });
    expect((await service.schoolYear('SCH1', 2026)).periods.map((p) => p.name)).toEqual(['T1', 'T2', 'Verano']);
  });

  it('edits only its own periods, and deletes them only while they hold nothing', async () => {
    const { service } = setup(
      [{ ...g1 }, { ...g1, id: 'o1', schoolId: 'SCH1' }, { ...g2, id: 'o2', schoolId: 'SCH1' }],
      [{ periodId: 'o1', schoolId: 'SCH1' }],
    );
    await expect(service.updateForSchool('SCH1', 'g1', { name: 'x' })).rejects.toThrow(NotFoundException);
    await expect(service.updateForSchool('SCH2', 'o1', { name: 'x' })).rejects.toThrow(NotFoundException);
    expect(await service.updateForSchool('SCH1', 'o1', { endDate: d('2026-04-30') })).toMatchObject({ usage: 1 });
    await expect(service.updateForSchool('SCH1', 'o1', { endDate: d('2026-06-01') })).rejects.toThrow(BadRequestException);
    await expect(service.removeForSchool('SCH1', 'o1')).rejects.toThrow(PERIOD_IN_USE);
    await service.removeForSchool('SCH1', 'o2');
    expect((await service.schoolYear('SCH1', 2026)).periods.map((p) => p.id)).toEqual(['o1']);
  });

  it('restore moves grades back by position when counts match, and refuses otherwise', async () => {
    const one = setup(
      [{ ...g1 }, { ...g2 }, { ...g1, id: 'o1', schoolId: 'SCH1' }, { ...g2, id: 'o2', schoolId: 'SCH1' }],
      [{ periodId: 'o2', schoolId: 'SCH1' }],
    );
    const year = await one.service.restoreGlobal('SCH1', 2026);
    expect(year).toMatchObject({ custom: false });
    expect(year.periods.map((p) => [p.id, p.usage])).toEqual([
      ['g1', 0],
      ['g2', 1],
    ]);

    const other = setup([{ ...g1 }, { ...g2 }, { ...g1, id: 'o1', schoolId: 'SCH1' }], [{ periodId: 'o1', schoolId: 'SCH1' }]);
    await expect(other.service.restoreGlobal('SCH1', 2026)).rejects.toThrow(RESTORE_IN_USE);
  });
});
