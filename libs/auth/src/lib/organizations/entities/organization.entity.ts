import { Prisma } from '@generated/prisma';
export class Organization implements Prisma.OrganizationGetPayload<undefined> {
    id: string;

    name: string;

    slug: string | null;

    logo: string | null;

    metadata: string | null;

    description: string;

    active: boolean;

    onboardingCompleted: boolean;

    createdAt: Date;

    updatedAt: Date;
}
