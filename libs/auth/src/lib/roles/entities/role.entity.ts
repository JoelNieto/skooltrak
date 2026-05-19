import { Prisma } from '@generated/prisma';
import { Organization } from '../../organizations/entities/organization.entity';
import { Permission } from '../../permissions/entities/permission.entity';
export class Role
  implements
    Prisma.RoleGetPayload<{
      include: { permissions: true; organization: true };
    }>
{
    id: string;

    name: string;

    permissions: Permission[];

    description: string;

    organizationId: string | null;

    organization: Organization | null;

    createdAt: Date;

    updatedAt: Date;
}
