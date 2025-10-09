import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@ObjectType()
export class Role
  implements
    Prisma.RoleGetPayload<{
      include: { organization: true; permissions: true };
    }>
{
  @Field(() => String, { description: 'ID of the role (auto-generated)' })
  id: string;

  @Field(() => Organization, {
    description: 'Organization of the role',
    nullable: true,
  })
  organization: Organization;

  @Field(() => String, { description: 'Name of the role' })
  name: string;

  @Field(() => String, { description: 'Description of the role' })
  description: string;

  @Field(() => String, {
    description: 'Organization ID of the role',
    nullable: true,
  })
  organizationId: string;

  @Field(() => [Permission], { description: 'Permissions of the role' })
  permissions: Permission[];

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
