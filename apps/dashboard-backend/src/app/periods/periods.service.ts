import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@generated/prisma';
import { PrismaService } from '../prisma.service';
import { CreatePeriodInput } from './dto/create-period.input';
import { CreateSchoolPeriodInput, UpdateSchoolPeriodInput } from './dto/school-period.input';
import { UpdatePeriodInput } from './dto/update-period.input';
import { SchoolPeriod, SchoolPeriodsYear } from './entities/school-period.entity';
import {
  assertNoOverlap,
  assertPeriodDates,
  loadSchoolPeriods,
  usesCustomPeriods,
} from './school-periods';

export const PERIOD_NOT_FOUND = 'Periodo no encontrado';
export const PERIOD_NAME_REQUIRED = 'El nombre del periodo es obligatorio';
export const PERIODS_ALREADY_CUSTOM = 'El colegio ya usa periodos propios este año';
export const PERIOD_IN_USE = 'El periodo tiene calificaciones o evaluaciones de hábitos; no se puede eliminar';
export const RESTORE_IN_USE =
  'Hay calificaciones en los periodos propios y no coinciden uno a uno con los globales; no se puede volver a los globales';

type Tx = Prisma.TransactionClient;

const ownSelect = { id: true, year: true, name: true, shortName: true, startDate: true, endDate: true } as const;

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPeriodInput: CreatePeriodInput) {
    return this.prisma.period.create({
      data: { ...createPeriodInput, schoolId: null },
    });
  }

  /** All global periods; with `schoolId`, the periods that school uses each year. */
  findAll(schoolId?: string) {
    return loadSchoolPeriods(this.prisma, schoolId);
  }

  /** The global periods of `year`; with `schoolId`, the ones that school uses. */
  findManyByYear(year: number, schoolId?: string) {
    return loadSchoolPeriods(this.prisma, schoolId, year);
  }

  findOne(id: string) {
    return this.prisma.period.findUnique({
      where: { id },
    });
  }

  update(id: string, updatePeriodInput: UpdatePeriodInput) {
    return this.prisma.period.update({
      where: { id },
      data: updatePeriodInput,
    });
  }

  remove(id: string) {
    return this.prisma.period.delete({ where: { id } });
  }

  // ── A school's own periods ─────────────────────────────────────────────────────────────────

  /** The periods the school uses in `year`, with how much of its work each one holds. */
  async schoolYear(schoolId: string, year: number, db: Tx | PrismaService = this.prisma): Promise<SchoolPeriodsYear> {
    const periods = await loadSchoolPeriods(db, schoolId, year);
    const usage = await this.usage(db, schoolId, periods.map((p) => p.id));
    return {
      year,
      custom: periods.some((p) => p.custom),
      periods: periods.map((p) => ({ ...p, usage: usage.get(p.id) ?? 0 })),
    };
  }

  /**
   * Switches the school to its own periods for `year`: copies the global ones as a starting point
   * and moves the school's grades and habit evaluations onto the copies.
   */
  async customize(schoolId: string, year: number): Promise<SchoolPeriodsYear> {
    return this.prisma.$transaction(async (tx) => {
      if (await usesCustomPeriods(tx, schoolId, year)) throw new ConflictException(PERIODS_ALREADY_CUSTOM);
      await this.copyGlobals(tx, schoolId, year);
      return this.schoolYear(schoolId, year, tx);
    });
  }

  /**
   * Back to the global periods for `year`: deletes the school's own periods. Grades and habit
   * evaluations in them move to the global period in the same position, which requires as many own
   * periods as global ones; otherwise only allowed while the own periods hold nothing.
   */
  async restoreGlobal(schoolId: string, year: number): Promise<SchoolPeriodsYear> {
    return this.prisma.$transaction(async (tx) => {
      const own = await tx.period.findMany({ where: { schoolId, year }, select: ownSelect, orderBy: { startDate: 'asc' } });
      if (!own.length) return this.schoolYear(schoolId, year, tx);
      const globals = await tx.period.findMany({
        where: { schoolId: null, year },
        select: { id: true },
        orderBy: { startDate: 'asc' },
      });
      const usage = await this.usage(tx, schoolId, own.map((p) => p.id));
      const used = [...usage.values()].some((n) => n > 0);
      if (used) {
        if (own.length !== globals.length) throw new BadRequestException(RESTORE_IN_USE);
        for (const [i, p] of own.entries()) await this.movePeriodWork(tx, schoolId, p.id, globals[i].id);
      }
      await tx.period.deleteMany({ where: { schoolId, year } });
      return this.schoolYear(schoolId, year, tx);
    });
  }

  /** Adds one of the school's own periods (switching the year to own periods first if needed). */
  async createForSchool(schoolId: string, input: CreateSchoolPeriodInput): Promise<SchoolPeriod> {
    const year = Number(input.year);
    if (!Number.isInteger(year)) throw new BadRequestException('Año inválido');
    const name = input.name?.trim();
    if (!name) throw new BadRequestException(PERIOD_NAME_REQUIRED);
    assertPeriodDates(input.startDate, input.endDate);

    return this.prisma.$transaction(async (tx) => {
      if (!(await usesCustomPeriods(tx, schoolId, year))) await this.copyGlobals(tx, schoolId, year);
      const siblings = await tx.period.findMany({ where: { schoolId, year }, select: ownSelect });
      assertNoOverlap(input, siblings);
      const created = await tx.period.create({
        data: {
          schoolId,
          year,
          name,
          shortName: input.shortName?.trim() ?? '',
          startDate: input.startDate,
          endDate: input.endDate,
        },
        select: ownSelect,
      });
      return { ...created, custom: true, usage: 0 };
    });
  }

  /** Edits one of the school's own periods. */
  async updateForSchool(schoolId: string, periodId: string, input: UpdateSchoolPeriodInput): Promise<SchoolPeriod> {
    const period = await this.ownPeriod(schoolId, periodId);
    const name = input.name === undefined ? period.name : input.name.trim();
    if (!name) throw new BadRequestException(PERIOD_NAME_REQUIRED);
    const next = {
      id: period.id,
      name,
      shortName: input.shortName === undefined ? period.shortName : input.shortName.trim(),
      startDate: input.startDate ?? period.startDate,
      endDate: input.endDate ?? period.endDate,
    };
    assertPeriodDates(next.startDate, next.endDate);
    const siblings = await this.prisma.period.findMany({ where: { schoolId, year: period.year }, select: ownSelect });
    assertNoOverlap(next, siblings);

    const { id, ...data } = next;
    const saved = await this.prisma.period.update({ where: { id }, data, select: ownSelect });
    const usage = await this.usage(this.prisma, schoolId, [id]);
    return { ...saved, custom: true, usage: usage.get(id) ?? 0 };
  }

  /** Deletes one of the school's own periods while it holds no grades or habit evaluations. */
  async removeForSchool(schoolId: string, periodId: string): Promise<void> {
    const period = await this.ownPeriod(schoolId, periodId);
    const usage = await this.usage(this.prisma, schoolId, [period.id]);
    if (usage.get(period.id)) throw new BadRequestException(PERIOD_IN_USE);
    await this.prisma.period.delete({ where: { id: period.id } });
  }

  private async ownPeriod(schoolId: string, periodId: string) {
    const period = await this.prisma.period.findFirst({ where: { id: periodId, schoolId }, select: ownSelect });
    if (!period) throw new NotFoundException(PERIOD_NOT_FOUND);
    return period;
  }

  /** Copies the year's global periods into the school and moves its work onto the copies. */
  private async copyGlobals(tx: Tx, schoolId: string, year: number): Promise<void> {
    const globals = await tx.period.findMany({ where: { schoolId: null, year }, select: ownSelect });
    for (const g of globals) {
      const copy = await tx.period.create({
        data: { schoolId, year, name: g.name, shortName: g.shortName, startDate: g.startDate, endDate: g.endDate },
        select: { id: true },
      });
      await this.movePeriodWork(tx, schoolId, g.id, copy.id);
    }
  }

  /** Moves the school's grade columns and habit evaluations from one period to another. */
  private async movePeriodWork(tx: Tx, schoolId: string, from: string, to: string): Promise<void> {
    await tx.grade.updateMany({ where: { periodId: from, course: { schoolId } }, data: { periodId: to } });
    await tx.habitEvaluation.updateMany({
      where: { periodId: from, classGroup: { schoolId } },
      data: { periodId: to },
    });
  }

  /** Per period: the school's grade columns plus habit evaluations in it. */
  private async usage(db: Tx | PrismaService, schoolId: string, periodIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (!periodIds.length) return counts;
    const [grades, habits] = await Promise.all([
      db.grade.groupBy({
        by: ['periodId'],
        where: { periodId: { in: periodIds }, course: { schoolId } },
        _count: { _all: true },
      }),
      db.habitEvaluation.groupBy({
        by: ['periodId'],
        where: { periodId: { in: periodIds }, classGroup: { schoolId } },
        _count: { _all: true },
      }),
    ]);
    for (const row of [...grades, ...habits]) counts.set(row.periodId, (counts.get(row.periodId) ?? 0) + row._count._all);
    return counts;
  }
}
