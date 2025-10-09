import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateRoleInput implements Prisma.RoleUncheckedCreateInput {
  @Field(() => String, { description: 'Name of the role' })
  name: string;
  @Field(() => String, { description: 'Description of the role' })
  description: string;
  @Field(() => String, {
    description: 'Organization ID of the role',
    nullable: true,
  })
  organizationId?: string;

  @Field(() => [String], { description: 'Permissions of the role' })
  permissionIds: string[];
}
