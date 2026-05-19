import { Prisma } from '@generated/prisma';
type CreateSchoolInputType = Omit<Prisma.SchoolUncheckedCreateInput, 'organizationId'> & {
  organizationId?: string;
};
export class CreateSchoolInput implements CreateSchoolInputType {
    organizationId?: string;

    slug?: string | null;

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

    primaryColor?: string | null;
    secondaryColor?: string | null;
    tertiaryColor?: string | null;

    currentYear: number;
}
