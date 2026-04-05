import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { StoreCartItem } from './entities/store-cart-item.entity';
import { StoreProduct } from './entities/store-product.entity';

@Resolver(() => StoreCartItem)
export class StoreCartItemResolver {
  @ResolveField(() => StoreProduct)
  product(@Parent() item: { variant?: { product?: StoreProduct } }) {
    return item.variant?.product as StoreProduct;
  }
}
