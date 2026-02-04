import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Organization implements Prisma.OrganizationGetPayload<undefined> {
  @Field(() => String, { description: 'Organization id' })
  id: string;

  @Field(() => String, { description: 'Organization name' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Organization slug' })
  slug: string | null;

  @Field(() => String, { nullable: true, description: 'Organization logo' })
  logo: string | null;

  @Field(() => String, { nullable: true, description: 'Organization metadata' })
  metadata: string | null;

  @Field(() => String, { description: 'Organization description' })
  description: string;

  @Field(() => Boolean, { description: 'Organization active status' })
  active: boolean;

  @Field(() => Boolean, { description: 'Whether onboarding has been completed' })
  onboardingCompleted: boolean;

  @Field(() => Date, { description: 'Organization created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Organization updated at' })
  updatedAt: Date;
}
