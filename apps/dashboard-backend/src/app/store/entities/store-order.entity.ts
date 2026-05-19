import { Prisma } from '@generated/prisma';
import { $Enums } from '@generated/prisma';
import { StoreOrderItem } from './store-order-item.entity';

export class StoreOrder {
    id: string;

    schoolId: string;

    userId: string;

    total: Prisma.Decimal;

    status: $Enums.StoreOrderStatus;

    paymentStatus: $Enums.StorePaymentStatus;

    notes: string | null;

    createdAt: Date;

    updatedAt: Date;

    items: StoreOrderItem[];
}
