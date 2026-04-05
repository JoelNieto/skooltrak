import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { StoreProduct } from './entities/store-product.entity';

@Resolver(() => StoreProduct)
export class StoreProductFieldsResolver {
  @ResolveField(() => Int, { name: 'totalStock' })
  totalStock(@Parent() product: { variants?: { stock: number }[] }) {
    return (product.variants ?? []).reduce((sum, v) => sum + v.stock, 0);
  }

  @ResolveField(() => Boolean, { name: 'hasOutOfStockVariant' })
  hasOutOfStockVariant(@Parent() product: { variants?: { stock: number }[] }) {
    const variants = product.variants ?? [];
    return variants.length > 0 && variants.some((v) => v.stock <= 0);
  }
}
