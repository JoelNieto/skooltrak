import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/** Global period fields a school can adjust. */
export interface PeriodFields {
  name: string;
  shortName: string;
  startDate: Date;
  endDate: Date;
}

/** A school's override row: null fields fall back to the global period. */
export interface PeriodOverrideFields {
  name: string | null;
  shortName: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

/** A period as one school sees it: the global period with that school's override applied. */
export interface EffectivePeriod extends PeriodFields {
  id: string;
  year: number;
  /** True when the school changed at least one field. */
  overridden: boolean;
}

export const PERIOD_DATES_INVALID = 'La fecha de inicio debe ser anterior o igual a la fecha de fin';

/** The global period with the school's override (if any) applied field by field. */
export function applyPeriodOverride<T extends PeriodFields & { id: string; year: number }>(
  period: T,
  override: PeriodOverrideFields | null | undefined,
): EffectivePeriod {
  const o = override ?? null;
  return {
    id: period.id,
    year: period.year,
    name: o?.name ?? period.name,
    shortName: o?.shortName ?? period.shortName,
    startDate: o?.startDate ?? period.startDate,
    endDate: o?.endDate ?? period.endDate,
    overridden: !!o && (o.name !== null || o.shortName !== null || o.startDate !== null || o.endDate !== null),
  };
}

const byStart = (a: EffectivePeriod, b: EffectivePeriod) =>
  a.startDate.getTime() - b.startDate.getTime() || a.name.localeCompare(b.name);

const overrideSelect = { name: true, shortName: true, startDate: true, endDate: true } as const;

/**
 * The periods of `year` as `schoolId` sees them (global periods + that school's overrides), ordered
 * by their effective start date. Without a school, the global periods.
 */
export async function loadSchoolPeriods(
  prisma: PrismaService,
  schoolId: string | null | undefined,
  year?: number,
): Promise<EffectivePeriod[]> {
  const rows = await prisma.period.findMany({
    where: year === undefined ? {} : { year },
    select: {
      id: true,
      year: true,
      name: true,
      shortName: true,
      startDate: true,
      endDate: true,
      ...(schoolId ? { schoolOverrides: { where: { schoolId }, select: overrideSelect } } : {}),
    },
  });
  return rows
    .map((row) => {
      const { schoolOverrides, ...period } = row as typeof row & { schoolOverrides?: PeriodOverrideFields[] };
      return applyPeriodOverride(period, schoolOverrides?.[0]);
    })
    .sort((a, b) => a.year - b.year || byStart(a, b));
}

/** 400 unless start ≤ end. */
export function assertPeriodDates(startDate: Date, endDate: Date): void {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    throw new BadRequestException(PERIOD_DATES_INVALID);
  }
}
