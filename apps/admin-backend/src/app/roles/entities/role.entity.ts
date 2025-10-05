import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Role implements Prisma.RoleCreateInput {
  @Field(() => String, { description: 'ID of the role (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'Name of the role' })
  name: string;
  @Field(() => String, { description: 'Description of the role' })
  description: string;
  @Field(() => [User], { description: 'Users of the role' })
  users?: Prisma.UserCreateNestedManyWithoutRoleInput;
  @Field(() => Organization, { description: 'Organization of the role' })
  organization: Prisma.OrganizationCreateNestedOneWithoutRolesInput;
  @Field(() => [Permission], { description: 'Permissions of the role' })
  permissions?: Prisma.RolePermissionCreateNestedManyWithoutRoleInput;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
