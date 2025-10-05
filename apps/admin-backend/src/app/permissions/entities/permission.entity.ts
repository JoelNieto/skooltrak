import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class Permission implements Prisma.PermissionCreateInput {
  @Field(() => String, { description: 'Descriptive ID of the permission' })
  descriptiveId: string;
  @Field(() => String, { description: 'Description of the permission' })
  description: string;
}
