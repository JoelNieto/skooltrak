import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';
import { Role } from '../../roles/entities/role.entity';

@ObjectType()
export class User implements Prisma.UserCreateInput {
  @Field(() => String, { description: 'ID of the user (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'Email of the user' })
  email: string;
  @Field(() => String, { description: 'Name of the user' })
  name: string;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
  @Field(() => Role, { description: 'Role of the user' })
  role: Prisma.RoleCreateNestedOneWithoutUsersInput;
  @Field(() => Organization, { description: 'Organization of the user' })
  organization: Prisma.OrganizationCreateNestedOneWithoutUsersInput;
}
