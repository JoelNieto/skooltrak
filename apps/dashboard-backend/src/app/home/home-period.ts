import { PrismaService } from '../prisma.service';
import { addDays, utcDate } from './home-time';

export interface PeriodRef {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

/**
 * BR-HOM-001.3: the period of the school year that contains `today`; otherwise the most recently
 * ended one; otherwise none.
 */
export function pickCurrentPeriod(periods: PeriodRef[], today: string): PeriodRef | null {
  const dayStart = utcDate(today);
  const nextDayStart = utcDate(addDays(today, 1));

  const current = periods.find((p) => p.startDate < nextDayStart && p.endDate >= dayStart);
  if (current) return current;

  const ended = periods
    .filter((p) => p.endDate < dayStart)
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  return ended[0] ?? null;
}

/** The period that ended most recently before `current` started (same school year). */
export function pickPreviousPeriod(periods: PeriodRef[], current: PeriodRef | null): PeriodRef | null {
  if (!current) return null;
  const before = periods
    .filter((p) => p.id !== current.id && p.endDate <= current.startDate)
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  return before[0] ?? null;
}

/** Current (BR-HOM-001.3) and previous period of the school year. */
export async function resolvePeriodPair(
  prisma: PrismaService,
  year: number,
  today: string,
): Promise<{ current: PeriodRef | null; previous: PeriodRef | null }> {
  const periods = await loadPeriods(prisma, year);
  const current = pickCurrentPeriod(periods, today);
  return { current, previous: pickPreviousPeriod(periods, current) };
}

function loadPeriods(prisma: PrismaService, year: number) {
  return prisma.period.findMany({
    where: { year },
    select: { id: true, name: true, startDate: true, endDate: true },
    orderBy: { startDate: 'asc' },
  });
}

export async function resolveCurrentPeriod(
  prisma: PrismaService,
  year: number,
  today: string,
): Promise<PeriodRef | null> {
  return pickCurrentPeriod(await loadPeriods(prisma, year), today);
}
