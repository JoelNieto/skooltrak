import { Prisma } from '@generated/prisma';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { StoreProduct } from './store-product.entity';

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

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: Prisma.Decimal;
}
