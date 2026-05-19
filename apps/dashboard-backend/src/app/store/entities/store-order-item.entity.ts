import { Prisma } from '@generated/prisma';
import { StoreProduct } from './store-product.entity';
import { StoreProductVariant } from './store-product-variant.entity';

export class StoreOrderItem {
    id: string;

    orderId: string;

    productId: string;

    product: StoreProduct;

    variantId: string | null;

    variantLabel: string | null;

    variant: StoreProductVariant | null;

    quantity: number;

    unitPrice: Prisma.Decimal;
}
