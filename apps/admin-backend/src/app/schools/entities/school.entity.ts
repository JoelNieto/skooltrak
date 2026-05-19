import { Organization } from '@/auth';
export class School {
    id: string;
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
    currencyCode: string;
    createdAt: Date;
    updatedAt: Date;
    organization: Organization;
    organizationId: string;
    currentYear: number;
}
