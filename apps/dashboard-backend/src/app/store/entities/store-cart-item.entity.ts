import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StoreProduct } from './store-product.entity';
import { StoreProductVariant } from './store-product-variant.entity';

@ObjectType()
export class StoreCartItem {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  variantId: string;

  @Field(() => StoreProductVariant)
  variant: StoreProductVariant;

  /** Resolved from variant.product */
  @Field(() => StoreProduct)
  product: StoreProduct;

  @Field(() => Int)
  quantity: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
