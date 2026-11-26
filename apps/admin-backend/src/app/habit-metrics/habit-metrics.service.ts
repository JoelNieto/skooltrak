import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateHabitMetricInput } from './dto/create-habit-metric.input';
import { UpdateHabitMetricInput } from './dto/update-habit-metric.input';

export const GLOBAL_HABIT_NAME_TAKEN = 'Ya existe un hábito global con ese nombre';

@Injectable()
export class HabitMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createHabitMetricInput: CreateHabitMetricInput) {
    await this.assertGlobalNameFree(createHabitMetricInput.name);
    return this.prisma.habitMetric.create({
      data: { ...createHabitMetricInput, schoolId: null },
    });
  }

  /** The global habit metrics (schools' own ones are managed from each school). */
  findAll() {
    return this.prisma.habitMetric.findMany({
      where: { schoolId: null },
      orderBy: { order: 'asc' },
    });
  }

  /** The schools that use their own habit metrics instead of the global ones. */
  async customSchools(): Promise<{ id: string; name: string; metrics: number }[]> {
    const rows = await this.prisma.habitMetric.groupBy({
      by: ['schoolId'],
      where: { schoolId: { not: null } },
      _count: { _all: true },
    });
    const schools = await this.prisma.school.findMany({
      where: { id: { in: rows.map((r) => r.schoolId as string) } },
      select: { id: true, name: true },
    });
    const count = new Map(rows.map((r) => [r.schoolId, r._count._all]));
    return schools
      .map((s) => ({ ...s, metrics: count.get(s.id) ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  findOne(id: string) {
    return this.prisma.habitMetric.findUnique({ where: { id } });
  }

  async update(id: string, updateHabitMetricInput: UpdateHabitMetricInput) {
    if (updateHabitMetricInput.name) await this.assertGlobalNameFree(updateHabitMetricInput.name, id);
    return this.prisma.habitMetric.update({
      where: { id },
      // A global metric stays global.
      data: { ...updateHabitMetricInput, schoolId: undefined },
    });
  }

  remove(id: string) {
    return this.prisma.habitMetric.delete({ where: { id } });
  }

  /** Global names are unique (the database only enforces it per school). */
  private async assertGlobalNameFree(name: string, exceptId?: string): Promise<void> {
    const taken = await this.prisma.habitMetric.count({
      where: {
        schoolId: null,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
    });
    if (taken) throw new ConflictException(GLOBAL_HABIT_NAME_TAKEN);
  }
}
