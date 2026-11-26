import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@generated/prisma';
import { PrismaService } from '../prisma.service';
import { CreateSchoolHabitMetricInput, UpdateSchoolHabitMetricInput } from './dto/school-habit-metric.input';
import { SchoolHabitMetric, SchoolHabitMetrics } from './entities/school-habit-metric.entity';
import { loadSchoolHabitMetrics, usesCustomHabitMetrics } from './school-habit-metrics';

export const HABIT_METRIC_NOT_FOUND = 'Hábito no encontrado';
export const HABIT_METRIC_NAME_REQUIRED = 'El nombre del hábito es obligatorio';
export const HABIT_METRIC_NAME_TAKEN = 'Ya existe un hábito con ese nombre en el colegio';
export const HABIT_METRICS_ALREADY_CUSTOM = 'El colegio ya usa hábitos propios';
export const HABIT_METRIC_IN_USE = 'El hábito tiene evaluaciones; desactívalo en lugar de eliminarlo';
export const HABIT_RESTORE_IN_USE =
  'Hay evaluaciones en hábitos propios sin un hábito global con el mismo nombre; no se puede volver a los globales';

type Tx = Prisma.TransactionClient;
type Db = Tx | PrismaService;

const ownSelect = { id: true, name: true, description: true, active: true, order: true } as const;
const key = (name: string) => name.trim().toLocaleLowerCase('es');

@Injectable()
export class HabitMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The global habit metrics; with `schoolId`, the ones that school uses. */
  findAll(schoolId?: string) {
    return loadSchoolHabitMetrics(this.prisma, schoolId);
  }

  findOne(id: string) {
    return this.prisma.habitMetric.findUnique({ where: { id } });
  }

  // ── A school's own habit metrics ───────────────────────────────────────────────────────────

  /** The metrics the school uses, with how many of its evaluations each one holds. */
  async schoolMetrics(schoolId: string, db: Db = this.prisma): Promise<SchoolHabitMetrics> {
    const metrics = await loadSchoolHabitMetrics(db, schoolId);
    const usage = await this.usage(db, schoolId, metrics.map((m) => m.id));
    return {
      custom: metrics.some((m) => m.custom),
      metrics: metrics.map((m) => ({ ...m, usage: usage.get(m.id) ?? 0 })),
    };
  }

  /** Switches the school to its own metrics: copies the global ones and moves its evaluations onto them. */
  async customize(schoolId: string): Promise<SchoolHabitMetrics> {
    return this.prisma.$transaction(async (tx) => {
      if (await usesCustomHabitMetrics(tx, schoolId)) throw new ConflictException(HABIT_METRICS_ALREADY_CUSTOM);
      await this.copyGlobals(tx, schoolId);
      return this.schoolMetrics(schoolId, tx);
    });
  }

  /**
   * Back to the global metrics: deletes the school's own. Evaluations move to the global metric with
   * the same name; refused when an evaluated own metric has no global namesake.
   */
  async restoreGlobal(schoolId: string): Promise<SchoolHabitMetrics> {
    return this.prisma.$transaction(async (tx) => {
      const own = await tx.habitMetric.findMany({ where: { schoolId }, select: ownSelect });
      if (!own.length) return this.schoolMetrics(schoolId, tx);
      const globals = await tx.habitMetric.findMany({ where: { schoolId: null }, select: { id: true, name: true } });
      const globalByName = new Map(globals.map((g) => [key(g.name), g.id]));
      const usage = await this.usage(tx, schoolId, own.map((m) => m.id));
      const moves = own.filter((m) => usage.get(m.id)).map((m) => ({ from: m.id, to: globalByName.get(key(m.name)) }));
      if (moves.some((m) => !m.to)) throw new BadRequestException(HABIT_RESTORE_IN_USE);
      for (const m of moves) await this.moveEvaluations(tx, schoolId, m.from, m.to as string);
      await tx.habitMetric.deleteMany({ where: { schoolId } });
      return this.schoolMetrics(schoolId, tx);
    });
  }

  /** Adds one of the school's own metrics (switching to own metrics first if needed). */
  async createForSchool(schoolId: string, input: CreateSchoolHabitMetricInput): Promise<SchoolHabitMetric> {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException(HABIT_METRIC_NAME_REQUIRED);
    return this.prisma.$transaction(async (tx) => {
      if (!(await usesCustomHabitMetrics(tx, schoolId))) await this.copyGlobals(tx, schoolId);
      const siblings = await tx.habitMetric.findMany({ where: { schoolId }, select: ownSelect });
      if (siblings.some((m) => key(m.name) === key(name))) throw new ConflictException(HABIT_METRIC_NAME_TAKEN);
      const order = input.order ?? Math.max(-1, ...siblings.map((m) => m.order)) + 1;
      const created = await tx.habitMetric.create({
        data: {
          schoolId,
          name,
          description: input.description?.trim() || null,
          active: input.active ?? true,
          order,
        },
        select: ownSelect,
      });
      return { ...created, custom: true, usage: 0 };
    });
  }

  /** Edits one of the school's own metrics. */
  async updateForSchool(
    schoolId: string,
    metricId: string,
    input: UpdateSchoolHabitMetricInput,
  ): Promise<SchoolHabitMetric> {
    const metric = await this.ownMetric(schoolId, metricId);
    const name = input.name === undefined ? metric.name : input.name.trim();
    if (!name) throw new BadRequestException(HABIT_METRIC_NAME_REQUIRED);
    if (key(name) !== key(metric.name)) {
      const siblings = await this.prisma.habitMetric.findMany({ where: { schoolId }, select: { id: true, name: true } });
      if (siblings.some((m) => m.id !== metric.id && key(m.name) === key(name))) {
        throw new ConflictException(HABIT_METRIC_NAME_TAKEN);
      }
    }
    const saved = await this.prisma.habitMetric.update({
      where: { id: metric.id },
      data: {
        name,
        description: input.description === undefined ? metric.description : input.description?.trim() || null,
        active: input.active ?? metric.active,
        order: input.order ?? metric.order,
      },
      select: ownSelect,
    });
    const usage = await this.usage(this.prisma, schoolId, [metric.id]);
    return { ...saved, custom: true, usage: usage.get(metric.id) ?? 0 };
  }

  /** Deletes one of the school's own metrics while it has no evaluations. */
  async removeForSchool(schoolId: string, metricId: string): Promise<void> {
    const metric = await this.ownMetric(schoolId, metricId);
    const usage = await this.usage(this.prisma, schoolId, [metric.id]);
    if (usage.get(metric.id)) throw new BadRequestException(HABIT_METRIC_IN_USE);
    await this.prisma.habitMetric.delete({ where: { id: metric.id } });
  }

  private async ownMetric(schoolId: string, metricId: string) {
    const metric = await this.prisma.habitMetric.findFirst({ where: { id: metricId, schoolId }, select: ownSelect });
    if (!metric) throw new NotFoundException(HABIT_METRIC_NOT_FOUND);
    return metric;
  }

  private async copyGlobals(tx: Tx, schoolId: string): Promise<void> {
    const globals = await tx.habitMetric.findMany({ where: { schoolId: null }, select: ownSelect });
    for (const g of globals) {
      const { id, ...data } = g;
      const copy = await tx.habitMetric.create({ data: { ...data, schoolId }, select: { id: true } });
      await this.moveEvaluations(tx, schoolId, id, copy.id);
    }
  }

  /** Moves the school's habit evaluations from one metric to another. */
  private async moveEvaluations(tx: Tx, schoolId: string, from: string, to: string): Promise<void> {
    await tx.habitEvaluation.updateMany({
      where: { habitMetricId: from, classGroup: { schoolId } },
      data: { habitMetricId: to },
    });
  }

  private async usage(db: Db, schoolId: string, metricIds: string[]): Promise<Map<string, number>> {
    if (!metricIds.length) return new Map();
    const rows = await db.habitEvaluation.groupBy({
      by: ['habitMetricId'],
      where: { habitMetricId: { in: metricIds }, classGroup: { schoolId } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.habitMetricId, r._count._all]));
  }
}
