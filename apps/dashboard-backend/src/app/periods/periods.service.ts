import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePeriodInput } from './dto/create-period.input';
import { SchoolPeriodOverrideInput } from './dto/school-period-override.input';
import { UpdatePeriodInput } from './dto/update-period.input';
import { SchoolPeriod } from './entities/school-period.entity';
import { applyPeriodOverride, assertPeriodDates, loadSchoolPeriods, PeriodOverrideFields } from './school-periods';

export const PERIOD_NOT_FOUND = 'Periodo no encontrado';

const periodSelect = { id: true, year: true, name: true, shortName: true, startDate: true, endDate: true } as const;
const overrideSelect = { name: true, shortName: true, startDate: true, endDate: true } as const;

/** Trimmed text, or null when empty or equal to the global value. */
function textOverride(value: string | null | undefined, fallback: string): string | null {
  const v = value?.trim();
  return v && v !== fallback ? v : null;
}

/** The date, or null when missing or on the same day as the global value. */
function dateOverride(value: Date | null | undefined, fallback: Date): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10) === fallback.toISOString().slice(0, 10) ? null : date;
}

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPeriodInput: CreatePeriodInput) {
    return this.prisma.period.create({
      data: createPeriodInput,
    });
  }

  /** All periods; with `schoolId`, as that school sees them. */
  findAll(schoolId?: string) {
    if (schoolId) return loadSchoolPeriods(this.prisma, schoolId);
    return this.prisma.period.findMany({ orderBy: [{ year: 'desc' }, { startDate: 'asc' }] });
  }

  /** The periods of `year`; with `schoolId`, as that school sees them (overrides applied). */
  findManyByYear(year: number, schoolId?: string) {
    if (schoolId) return loadSchoolPeriods(this.prisma, schoolId, year);
    return this.prisma.period.findMany({
      where: { year },
      orderBy: { startDate: 'asc' },
    });
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

  /** The year's periods for one school: effective values, global defaults and the school's override. */
  async schoolPeriods(schoolId: string, year: number): Promise<SchoolPeriod[]> {
    const rows = await this.prisma.period.findMany({
      where: { year },
      select: { ...periodSelect, schoolOverrides: { where: { schoolId }, select: overrideSelect } },
    });
    return rows
      .map(({ schoolOverrides, ...period }) => this.toSchoolPeriod(period, schoolOverrides[0] ?? null))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime() || a.name.localeCompare(b.name));
  }

  /**
   * Sets the school's override of one period. Fields left empty or equal to the global value fall back
   * to it; when nothing differs, the override is removed.
   */
  async setOverride(schoolId: string, periodId: string, input: SchoolPeriodOverrideInput): Promise<SchoolPeriod> {
    const period = await this.prisma.period.findUnique({ where: { id: periodId }, select: periodSelect });
    if (!period) throw new NotFoundException(PERIOD_NOT_FOUND);

    const data: PeriodOverrideFields = {
      name: textOverride(input.name, period.name),
      shortName: textOverride(input.shortName, period.shortName),
      startDate: dateOverride(input.startDate, period.startDate),
      endDate: dateOverride(input.endDate, period.endDate),
    };
    assertPeriodDates(data.startDate ?? period.startDate, data.endDate ?? period.endDate);

    const empty = Object.values(data).every((v) => v === null);
    if (empty) {
      await this.prisma.schoolPeriod.deleteMany({ where: { schoolId, periodId } });
      return this.toSchoolPeriod(period, null);
    }
    const saved = await this.prisma.schoolPeriod.upsert({
      where: { schoolId_periodId: { schoolId, periodId } },
      create: { schoolId, periodId, ...data },
      update: data,
      select: overrideSelect,
    });
    return this.toSchoolPeriod(period, saved);
  }

  /** Removes the school's override of one period: it uses the global values again. */
  async clearOverride(schoolId: string, periodId: string): Promise<SchoolPeriod> {
    const period = await this.prisma.period.findUnique({ where: { id: periodId }, select: periodSelect });
    if (!period) throw new NotFoundException(PERIOD_NOT_FOUND);
    await this.prisma.schoolPeriod.deleteMany({ where: { schoolId, periodId } });
    return this.toSchoolPeriod(period, null);
  }

  private toSchoolPeriod(
    period: { id: string; year: number; name: string; shortName: string; startDate: Date; endDate: Date },
    override: PeriodOverrideFields | null,
  ): SchoolPeriod {
    return {
      ...applyPeriodOverride(period, override),
      defaults: {
        name: period.name,
        shortName: period.shortName,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      override,
    };
  }
}
