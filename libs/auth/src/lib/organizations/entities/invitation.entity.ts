import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Invitation {
  @Field(() => String)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  inviterId: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => String)
  role: string;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  expiresAt: Date;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class Member {
  @Field(() => String)
  id: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  role: string;

  @Field(() => Date)
  createdAt: Date;
}
