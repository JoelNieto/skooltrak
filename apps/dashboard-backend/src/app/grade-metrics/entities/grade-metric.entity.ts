import { Prisma } from '@generated/prisma';
export class GradeMetric
  implements Prisma.GradeMetricGetPayload<{ include: undefined }>
{
    id: string;

    name: string;

    minimum: Prisma.Decimal;

    maximum: Prisma.Decimal;

    minimumApproval: Prisma.Decimal;

    minimumExcellence: Prisma.Decimal;

    createdAt: Date;

    updatedAt: Date;
}
