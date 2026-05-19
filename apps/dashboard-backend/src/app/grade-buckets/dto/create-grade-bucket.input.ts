import { Prisma } from '@generated/prisma';
export class CreateGradeBucketInput
  implements Prisma.GradeBucketUncheckedCreateInput
{
    name: string;
    weight: number | Prisma.Decimal;
    courseId: string;
}
