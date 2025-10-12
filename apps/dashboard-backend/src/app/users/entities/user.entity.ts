import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class User implements Prisma.UserGetPayload<undefined> {
  @Field(() => String)
  id: string;
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
  organizationId: string;
  @Field(() => Date)
  lastLogin: Date;
  @Field(() => Boolean)
  isBlocked: boolean;
  @Field(() => Date)
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
}
