import { Prisma } from '@generated/prisma';
export class CreateHabitMetricInput
  implements Prisma.HabitMetricUncheckedCreateInput
{
    name: string;

    description?: string;

    active?: boolean;

    order?: number;
}
