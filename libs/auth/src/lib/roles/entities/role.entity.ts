import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { Organization } from '../../organizations/entities/organization.entity';
import { Permission } from '../../permissions/entities/permission.entity';
@ObjectType()
export class Role
  implements
    Prisma.RoleGetPayload<{
      include: { permissions: true; organization: true };
    }>
{
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => [Permission])
  permissions: Permission[];

  @Field(() => String)
  description: string;

  @Field(() => String, { nullable: true })
  organizationId: string | null;

  @Field(() => Organization, { nullable: true })
  organization: Organization | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
