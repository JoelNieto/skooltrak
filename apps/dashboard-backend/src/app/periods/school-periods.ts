import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@generated/prisma';
import { PrismaService } from '../prisma.service';

/** A period as one school sees it. */
export interface EffectivePeriod {
  id: string;
  year: number;
  name: string;
  shortName: string;
  startDate: Date;
  endDate: Date;
  /** True when it is the school's own period, false for a global one. */
  custom: boolean;
}

export const PERIOD_DATES_INVALID = 'La fecha de inicio debe ser anterior o igual a la fecha de fin';
export const PERIOD_OVERLAP = 'El periodo se solapa con';
export const PERIOD_NOT_FOR_SCHOOL = 'El periodo no corresponde al calendario del colegio';

type Db = PrismaService | Prisma.TransactionClient;

const periodSelect = {
  id: true,
  year: true,
  name: true,
  shortName: true,
  startDate: true,
  endDate: true,
  schoolId: true,
} as const;

const byYearThenStart = (a: EffectivePeriod, b: EffectivePeriod) =>
  a.year - b.year || a.startDate.getTime() - b.startDate.getTime() || a.name.localeCompare(b.name);

/**
 * Which periods a school uses, per year: its own periods for any year where it has at least one,
 * otherwise the global periods of that year. Pure, so callers can reuse a single query.
 */
export function pickSchoolPeriods(
  rows: Array<{
    id: string;
    year: number;
    name: string;
    shortName: string;
    startDate: Date;
    endDate: Date;
    schoolId?: string | null;
  }>,
  schoolId: string | null | undefined,
): EffectivePeriod[] {
  const customYears = new Set(rows.filter((r) => schoolId && r.schoolId === schoolId).map((r) => r.year));
  return rows
    .filter((r) => (r.schoolId == null ? !customYears.has(r.year) : !!schoolId && r.schoolId === schoolId))
    .map(({ schoolId: owner, ...p }) => ({ ...p, custom: owner != null }))
    .sort(byYearThenStart);
}

/**
 * The periods of `year` (all years when omitted) as `schoolId` sees them, ordered by start date.
 * Without a school, the global periods.
 */
export async function loadSchoolPeriods(
  prisma: Db,
  schoolId: string | null | undefined,
  year?: number,
): Promise<EffectivePeriod[]> {
  const rows = await prisma.period.findMany({
    where: {
      ...(year === undefined ? {} : { year }),
      OR: schoolId ? [{ schoolId: null }, { schoolId }] : [{ schoolId: null }],
    },
    select: periodSelect,
  });
  return pickSchoolPeriods(rows, schoolId);
}

/** True when the school uses its own periods for `year`. */
export async function usesCustomPeriods(prisma: Db, schoolId: string, year: number): Promise<boolean> {
  return (await prisma.period.count({ where: { schoolId, year } })) > 0;
}

/**
 * 400 unless the period is one the school uses: its own, or a global one of a year in which the
 * school has no periods of its own.
 */
export async function assertPeriodForSchool(prisma: Db, periodId: string, schoolId: string): Promise<void> {
  const period = await prisma.period.findUnique({ where: { id: periodId }, select: { year: true, schoolId: true } });
  if (!period) throw new BadRequestException(PERIOD_NOT_FOR_SCHOOL);
  if (period.schoolId !== null) {
    if (period.schoolId !== schoolId) throw new BadRequestException(PERIOD_NOT_FOR_SCHOOL);
    return;
  }
  if (await usesCustomPeriods(prisma, schoolId, period.year)) throw new BadRequestException(PERIOD_NOT_FOR_SCHOOL);
}

/** 400 unless start ≤ end. */
export function assertPeriodDates(startDate: Date, endDate: Date): void {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    throw new BadRequestException(PERIOD_DATES_INVALID);
  }
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** 400 when [startDate, endDate] shares a day with another of the periods (inclusive ranges). */
export function assertNoOverlap(
  candidate: { id?: string; startDate: Date; endDate: Date },
  others: Array<{ id: string; name: string; startDate: Date; endDate: Date }>,
): void {
  const clash = others.find(
    (o) => o.id !== candidate.id && day(o.startDate) <= day(candidate.endDate) && day(candidate.startDate) <= day(o.endDate),
  );
  if (clash) throw new BadRequestException(`${PERIOD_OVERLAP} ${clash.name}`);
}
