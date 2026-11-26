import { BadRequestException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { assertHabitMetricForSchool, pickSchoolHabitMetrics } from './school-habit-metrics';

const metric = (id: string, order: number, schoolId: string | null = null, active = true) => ({
  id,
  name: id,
  description: null,
  active,
  order,
  schoolId,
});
const rows = [metric('g-resp', 1), metric('g-punt', 0), metric('o-lead', 1, 'SCH1'), metric('o-team', 0, 'SCH1'), metric('x', 0, 'SCH9')];

describe('pickSchoolHabitMetrics', () => {
  it('uses only the school’s own metrics once it has any, by order', () => {
    expect(pickSchoolHabitMetrics(rows, 'SCH1').map((m) => [m.id, m.custom])).toEqual([
      ['o-team', true],
      ['o-lead', true],
    ]);
  });

  it('otherwise the global ones, never another school’s', () => {
    expect(pickSchoolHabitMetrics(rows, 'SCH2').map((m) => m.id)).toEqual(['g-punt', 'g-resp']);
    expect(pickSchoolHabitMetrics(rows, undefined).map((m) => m.id)).toEqual(['g-punt', 'g-resp']);
  });
});

describe('assertHabitMetricForSchool', () => {
  const prisma = (found: { schoolId: string | null } | null, own = 0) =>
    ({ habitMetric: { findUnique: jest.fn(async () => found), count: jest.fn(async () => own) } }) as never;

  it('accepts its own metric, or a global one while it has none of its own', async () => {
    await expect(assertHabitMetricForSchool(prisma({ schoolId: 'SCH1' }), 'o', 'SCH1')).resolves.toBeUndefined();
    await expect(assertHabitMetricForSchool(prisma({ schoolId: null }), 'g', 'SCH1')).resolves.toBeUndefined();
  });

  it('rejects another school’s metric, a global one once on its own, and unknown ids', async () => {
    await expect(assertHabitMetricForSchool(prisma({ schoolId: 'SCH9' }), 'x', 'SCH1')).rejects.toThrow(BadRequestException);
    await expect(assertHabitMetricForSchool(prisma({ schoolId: null }, 3), 'g', 'SCH1')).rejects.toThrow(BadRequestException);
    await expect(assertHabitMetricForSchool(prisma(null), 'nope', 'SCH1')).rejects.toThrow(BadRequestException);
  });
});
