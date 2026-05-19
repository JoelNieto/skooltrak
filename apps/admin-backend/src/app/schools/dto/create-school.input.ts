import { Prisma } from '@generated/prisma';
export class CreateSchoolInput implements Prisma.SchoolUncheckedCreateInput {
    organizationId: string;
    name: string;
    shortName: string;
    logo: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
    phone: string;
    website: string;
    currentYear: number;
}
