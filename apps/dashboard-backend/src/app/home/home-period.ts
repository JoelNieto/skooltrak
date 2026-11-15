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

export async function resolveCurrentPeriod(
  prisma: PrismaService,
  year: number,
  today: string,
): Promise<PeriodRef | null> {
  const periods = await prisma.period.findMany({
    where: { year },
    select: { id: true, name: true, startDate: true, endDate: true },
    orderBy: { startDate: 'asc' },
  });
  return pickCurrentPeriod(periods, today);
}
