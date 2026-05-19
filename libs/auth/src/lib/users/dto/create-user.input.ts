import { Prisma } from '@generated/prisma';
export class CreateUserInput implements Prisma.UserUncheckedCreateInput {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    roleId: string;
    organizationId: string;
}
