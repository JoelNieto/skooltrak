import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class Permission implements Prisma.PermissionGetPayload<false> {
  @Field(() => String, { description: 'ID of the permission (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'Descriptive ID of the permission' })
  descriptiveId: string;
  @Field(() => String, { description: 'Description of the permission' })
  description: string;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
