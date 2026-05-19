import { Prisma } from '@generated/prisma';
export class CreateRoleInput implements Prisma.RoleUncheckedCreateInput {
    name: string;

    description: string;

    organizationId?: string;
    permissionIds: string[];
}
