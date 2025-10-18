import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';
import { Role } from '../../roles/entities/role.entity';

@ObjectType()
export class User
  implements
    Prisma.UserGetPayload<{
      include: { role: { include: { permissions: true } } };
    }>
{
  @Field(() => String)
  id: string;
  @Field(() => Role)
  role: Role;

  @Field(() => String)
  email: string;
  @Field(() => String)
  firstName: string;
  @Field(() => String)
  lastName: string;
  password: string;
  @Field(() => String)
  roleId: string;
  @Field(() => String)
  organizationId: string | null;
  @Field(() => Organization, { nullable: true })
  organization: Organization | null;
  @Field(() => Date)
  lastLogin: Date | null;
  @Field(() => Boolean)
  isBlocked: boolean;
  @Field(() => Date)
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
}
