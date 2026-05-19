import { Prisma } from '@generated/prisma';
export class HabitMetric
  implements Prisma.HabitMetricGetPayload<{ include: undefined }>
{
    id: string;

    name: string;

    description: string | null;

    active: boolean;

    order: number;

    createdAt: Date;

    updatedAt: Date;
}
