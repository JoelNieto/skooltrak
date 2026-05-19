import { Organization } from '@/auth';
import { Prisma } from '@generated/prisma';
export class Subject implements Prisma.SubjectGetPayload<true> {
  schoolId: string;
    id: string;
    name: string;
    code: string;
    shortName: string;
    createdAt: Date;
    updatedAt: Date;
    organization: Organization;
    organizationId: string;
}
