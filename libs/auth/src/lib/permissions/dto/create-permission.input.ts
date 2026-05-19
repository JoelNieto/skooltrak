import { Prisma } from '@generated/prisma';
export class CreatePermissionInput
  implements Prisma.PermissionUncheckedCreateInput
{
    descriptiveId: string;

    description: string;
}
