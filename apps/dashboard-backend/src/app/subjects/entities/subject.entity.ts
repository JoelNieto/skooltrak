import { Organization } from '@/auth';
import { Prisma } from '@generated/prisma';
export class Subject
  implements Prisma.SubjectGetPayload<{ include: { organization: true } }>
{
    id: string;
    code: string;
    name: string;
    icon: string | null;
    area: string | null;
    organization: Organization;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
