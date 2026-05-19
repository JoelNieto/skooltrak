import { Prisma } from '@generated/prisma';
export class CreateOrganizationInput
  implements Prisma.OrganizationUncheckedCreateInput
{
    name: string;

    description: string;

    active?: boolean | undefined;
}
