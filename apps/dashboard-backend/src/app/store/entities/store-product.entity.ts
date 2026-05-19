import { Prisma } from '@generated/prisma';
import { StoreCategory } from './store-category.entity';
import { StoreProductVariant } from './store-product-variant.entity';

export class StoreProduct {
    id: string;

    schoolId: string;

    categoryId: string | null;

    category: StoreCategory | null;

    name: string;

    description: string | null;

    price: Prisma.Decimal;

    imageUrl: string | null;

    active: boolean;

    variants: StoreProductVariant[];

    createdAt: Date;

    updatedAt: Date;
}
