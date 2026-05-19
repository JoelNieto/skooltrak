import { Prisma } from '@generated/prisma';
export class Permission implements Prisma.PermissionGetPayload<undefined> {
    id: string;

    descriptiveId: string;

    description: string;

    createdAt: Date;

    updatedAt: Date;
}
