import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';
import { Role } from '../../roles/entities/role.entity';

@ObjectType()
export class User
  implements
    Prisma.UserGetPayload<{
      include: { role: true; organization: true };
    }>
{
  @Field(() => String, { description: 'ID of the user (auto-generated)' })
  id: string;
  @Field(() => Role, { description: 'Role of the user' })
  role: {
    name: string;
    id: string;
    organizationId: string | null;
    createdAt: Date;
    updatedAt: Date;
    description: string;
  };
  @Field(() => Organization, {
    description: 'Organization of the user',
    nullable: true,
  })
  organization: {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    active: boolean;
  };

  @Field(() => String, { description: 'Email of the user' })
  email: string;
  @Field(() => String, { description: 'First name of the user' })
  firstName: string;
  @Field(() => String, { description: 'Last name of the user' })
  lastName: string;
  @Field(() => String, { description: 'Password of the user' })
  password: string;
  @Field(() => String, { description: 'Role ID of the user' })
  roleId: string;
  @Field(() => String, {
    description: 'Organization ID of the user',
    nullable: true,
  })
  organizationId: string;
  @Field(() => Date, { description: 'Last login of the user' })
  lastLogin: Date;
  @Field(() => Boolean, { description: 'Is the user blocked' })
  isBlocked: boolean;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
