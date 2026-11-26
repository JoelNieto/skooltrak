import { ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { HABIT_METRIC_IN_USE, HABIT_RESTORE_IN_USE, HabitMetricsService } from './habit-metrics.service';

interface Row {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  order: number;
  schoolId: string | null;
}

/** In-memory metrics plus habit evaluations (metric and school per evaluation). */
function setup(metrics: Row[], evaluations: Array<{ habitMetricId: string; schoolId: string }> = []) {
  let n = 0;
  const match = (r: Row, where: Record<string, unknown> = {}) =>
    Object.entries(where).every(([k, v]) => {
      if (k === 'OR') return (v as Record<string, unknown>[]).some((w) => match(r, w));
      return (r as unknown as Record<string, unknown>)[k] === v;
    });
  const habitMetric = {
    findMany: jest.fn(async ({ where }: { where?: Record<string, unknown> }) => metrics.filter((r) => match(r, where))),
    findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) => metrics.find((r) => match(r, where)) ?? null),
    count: jest.fn(async ({ where }: { where: Record<string, unknown> }) => metrics.filter((r) => match(r, where)).length),
    create: jest.fn(async ({ data }: { data: Omit<Row, 'id'> }) => {
      const row = { id: `new-${++n}`, description: null, active: true, order: 0, ...data };
      metrics.push(row);
      return row;
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<Row> }) =>
      Object.assign(metrics.find((r) => r.id === where.id) ?? {}, data),
    ),
    delete: jest.fn(async ({ where }: { where: { id: string } }) => metrics.splice(metrics.findIndex((r) => r.id === where.id), 1)),
    deleteMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      for (const r of metrics.filter((x) => match(x, where))) metrics.splice(metrics.indexOf(r), 1);
    }),
  };
  const habitEvaluation = {
    updateMany: jest.fn(
      async ({ where, data }: { where: { habitMetricId: string; classGroup: { schoolId: string } }; data: { habitMetricId: string } }) => {
        for (const e of evaluations)
          if (e.habitMetricId === where.habitMetricId && e.schoolId === where.classGroup.schoolId) e.habitMetricId = data.habitMetricId;
      },
    ),
    groupBy: jest.fn(async ({ where }: { where: { habitMetricId: { in: string[] }; classGroup: { schoolId: string } } }) => {
      const counts = new Map<string, number>();
      for (const e of evaluations)
        if (where.habitMetricId.in.includes(e.habitMetricId) && e.schoolId === where.classGroup.schoolId)
          counts.set(e.habitMetricId, (counts.get(e.habitMetricId) ?? 0) + 1);
      return [...counts].map(([habitMetricId, c]) => ({ habitMetricId, _count: { _all: c } }));
    }),
  };
  const prisma = { habitMetric, habitEvaluation, $transaction: (fn: (tx: unknown) => unknown) => fn(prisma) };
  return { service: new HabitMetricsService(prisma as never), evaluations };
}

const g = (id: string, order: number): Row => ({ id, name: id, description: null, active: true, order, schoolId: null });

describe('HabitMetricsService: a school’s own habits', () => {
  it('customize copies the globals and moves only this school’s evaluations', async () => {
    const { service, evaluations } = setup([g('Responsabilidad', 0), g('Puntualidad', 1)], [
      { habitMetricId: 'Responsabilidad', schoolId: 'SCH1' },
      { habitMetricId: 'Responsabilidad', schoolId: 'SCH2' },
    ]);
    const result = await service.customize('SCH1');
    expect(result.custom).toBe(true);
    expect(result.metrics.map((m) => [m.name, m.custom, m.usage])).toEqual([
      ['Responsabilidad', true, 1],
      ['Puntualidad', true, 0],
    ]);
    expect(evaluations[0].habitMetricId).toBe(result.metrics[0].id);
    expect(evaluations[1].habitMetricId).toBe('Responsabilidad');
    await expect(service.customize('SCH1')).rejects.toThrow(ConflictException);
  });

  it('adds metrics last, rejecting a duplicate name', async () => {
    const { service } = setup([g('Responsabilidad', 0)]);
    const created = await service.createForSchool('SCH1', { name: ' Liderazgo ' });
    expect(created).toMatchObject({ name: 'Liderazgo', order: 1, custom: true });
    await expect(service.createForSchool('SCH1', { name: 'responsabilidad' })).rejects.toThrow(ConflictException);
    expect((await service.schoolMetrics('SCH1')).metrics.map((m) => m.name)).toEqual(['Responsabilidad', 'Liderazgo']);
  });

  it('edits only its own metrics and deletes them only while unevaluated', async () => {
    const { service } = setup(
      [g('G', 0), { ...g('A', 0), schoolId: 'SCH1' }, { ...g('B', 1), schoolId: 'SCH1' }],
      [{ habitMetricId: 'A', schoolId: 'SCH1' }],
    );
    await expect(service.updateForSchool('SCH1', 'G', { name: 'x' })).rejects.toThrow(NotFoundException);
    expect(await service.updateForSchool('SCH1', 'A', { active: false })).toMatchObject({ active: false, usage: 1 });
    await expect(service.removeForSchool('SCH1', 'A')).rejects.toThrow(HABIT_METRIC_IN_USE);
    await service.removeForSchool('SCH1', 'B');
    expect((await service.schoolMetrics('SCH1')).metrics.map((m) => m.id)).toEqual(['A']);
  });

  it('restore moves evaluations to the global metric with the same name, or refuses', async () => {
    const ok = setup([g('Responsabilidad', 0), { ...g('o1', 0), name: 'responsabilidad', schoolId: 'SCH1' }], [
      { habitMetricId: 'o1', schoolId: 'SCH1' },
    ]);
    const result = await ok.service.restoreGlobal('SCH1');
    expect(result).toMatchObject({ custom: false });
    expect(result.metrics.map((m) => [m.id, m.usage])).toEqual([['Responsabilidad', 1]]);

    const refused = setup([g('Responsabilidad', 0), { ...g('Liderazgo', 0), schoolId: 'SCH1' }], [
      { habitMetricId: 'Liderazgo', schoolId: 'SCH1' },
    ]);
    await expect(refused.service.restoreGlobal('SCH1')).rejects.toThrow(HABIT_RESTORE_IN_USE);
  });
});
