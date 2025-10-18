import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class Organization implements Prisma.OrganizationGetPayload<undefined> {
  @Field(() => String, { description: 'Organization name' })
  name: string;

  @Field(() => String, { description: 'Organization description' })
  description: string;

  @Field(() => Boolean, { description: 'Organization active status' })
  active: boolean;

  @Field(() => String, { description: 'Organization id' })
  id: string;

  @Field(() => Date, { description: 'Organization created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Organization updated at' })
  updatedAt: Date;
}
