import { Prisma } from '@generated/prisma';
export class Period implements Prisma.PeriodGetPayload<{ include: undefined }> {
    id: string;
    name: string;
    shortName: string;
    year: number;
    startDate: Date;
    endDate: Date;
    schoolId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
