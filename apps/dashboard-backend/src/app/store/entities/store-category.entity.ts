import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StoreCategory {
  @Field(() => String)
  id: string;

  @Field(() => String)
  schoolId: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Boolean)
  active: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
