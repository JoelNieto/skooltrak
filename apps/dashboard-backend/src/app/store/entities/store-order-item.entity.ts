import { Prisma } from '@generated/prisma';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { StoreProduct } from './store-product.entity';
import { StoreProductVariant } from './store-product-variant.entity';

@ObjectType()
export class StoreOrderItem {
  @Field(() => String)
  id: string;

  @Field(() => String)
  orderId: string;

  @Field(() => String)
  productId: string;

  @Field(() => StoreProduct)
  product: StoreProduct;

  @Field(() => String, { nullable: true })
  variantId: string | null;

  @Field(() => String, { nullable: true })
  variantLabel: string | null;

  @Field(() => StoreProductVariant, { nullable: true })
  variant: StoreProductVariant | null;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: Prisma.Decimal;
}
