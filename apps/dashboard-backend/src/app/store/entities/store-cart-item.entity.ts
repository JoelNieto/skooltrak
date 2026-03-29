import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StoreProduct } from './store-product.entity';

@ObjectType()
export class StoreCartItem {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  productId: string;

  @Field(() => StoreProduct)
  product: StoreProduct;

  @Field(() => Int)
  quantity: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
