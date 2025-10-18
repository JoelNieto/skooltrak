import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class Permission implements Prisma.PermissionGetPayload<undefined> {
  @Field(() => String)
  id: string;

  @Field(() => String)
  descriptiveId: string;

  @Field(() => String)
  description: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
