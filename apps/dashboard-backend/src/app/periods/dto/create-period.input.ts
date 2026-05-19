import { TransformDateToNoon } from '@/shared';
import { Prisma } from '@generated/prisma';
export class CreatePeriodInput implements Prisma.PeriodUncheckedCreateInput {
    name: string;
    shortName: string;
    year: number;
  @TransformDateToNoon()
    startDate: Date;
  @TransformDateToNoon()
    endDate: Date;
}
