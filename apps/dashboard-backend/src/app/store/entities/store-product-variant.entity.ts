import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StoreProductVariant {
  @Field(() => String)
  id: string;

  @Field(() => String)
  productId: string;

  @Field(() => String)
  label: string;

  @Field(() => Int)
  stock: number;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
