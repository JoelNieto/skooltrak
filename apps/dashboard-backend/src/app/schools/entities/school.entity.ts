import { Organization } from '@/auth';
export class School {
    id: string;
    organization: Organization;
    slug: string | null;
    name: string;
    organizationId: string;
    shortName: string;
    logo: string;
    logoUrl?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
    phone: string;
    website: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    tertiaryColor: string | null;
    currencyCode: string;
    currentYear: number;
    createdAt: Date;
    updatedAt: Date;
}
