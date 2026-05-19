import { Prisma } from '@generated/prisma';
export class CreateDegreeInput implements Prisma.DegreeUncheckedCreateInput {
    name: string;
    shortName: string;
    schoolId: string;
}
