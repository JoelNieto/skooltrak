import { Prisma } from '@generated/prisma';
export class CreateGradeMetricInput
  implements Prisma.GradeMetricUncheckedCreateInput
{
    name: string;

    minimum: number;

    maximum: number;

    minimumApproval: number;

    minimumExcellence: number;
}
