import { Prisma } from '@generated/prisma';
export class Period implements Prisma.PeriodGetPayload<{ include: undefined }> {
    id: string;
    name: string;
    shortName: string;
    year: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
