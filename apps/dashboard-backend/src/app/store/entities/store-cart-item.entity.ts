import { StoreProduct } from './store-product.entity';
import { StoreProductVariant } from './store-product-variant.entity';

export class StoreCartItem {
    id: string;

    userId: string;

    variantId: string;

    variant: StoreProductVariant;

  /** Resolved from variant.product */
    product: StoreProduct;

    quantity: number;

    createdAt: Date;

    updatedAt: Date;
}
