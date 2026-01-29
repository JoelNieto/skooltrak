import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { Organization } from '../../organizations/entities/organization.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserStudent } from './student.entity';
import { UserTeacher } from './teacher.entity';

@ObjectType()
export class User
  implements
    Prisma.UserGetPayload<{
      include: {
        role: { include: { permissions: true; organization: true } };
        teacher: true;
        student: true;
        organization: true;
      };
    }>
{
  @Field(() => String)
  id: string;

  @Field(() => Role)
  role: Role;

  @Field(() => String, { nullable: true })
  color: string | null;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  password: string;

  @Field(() => String, { nullable: true })
  image: string | null;

  @Field(() => Boolean)
  emailVerified: boolean;

  @Field(() => Boolean)
  banned: boolean;

  @Field(() => String, { nullable: true })
  banReason: string | null;

  @Field(() => Date, { nullable: true })
  banExpires: Date | null;

  @Field(() => String)
  roleId: string;

  @Field(() => String, { nullable: true })
  organizationId: string | null;

  @Field(() => Organization, { nullable: true })
  organization: Organization | null;

  @Field(() => Date, { nullable: true })
  lastLogin: Date | null;

  @Field(() => Boolean)
  isBlocked: boolean;

  @Field(() => UserTeacher, { nullable: true })
  teacher: UserTeacher | null;

  @Field(() => UserStudent, { nullable: true })
  student: UserStudent | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
