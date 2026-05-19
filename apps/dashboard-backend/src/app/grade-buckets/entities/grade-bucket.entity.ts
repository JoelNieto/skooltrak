import { Prisma } from '@generated/prisma';
export class GradeBucket implements Prisma.GradeBucketGetPayload<unknown> {
    id: string;
    name: string;
    weight: Prisma.Decimal;
    courseId: string;
    createdAt: Date;
    updatedAt: Date;
}
