import { Prisma } from '@generated/prisma';
import { $Enums } from '@generated/prisma';
import { Field, Float, ObjectType, registerEnumType } from '@nestjs/graphql';
import { StoreOrderItem } from './store-order-item.entity';

registerEnumType($Enums.StoreOrderStatus, { name: 'StoreOrderStatus' });
registerEnumType($Enums.StorePaymentStatus, { name: 'StorePaymentStatus' });

@ObjectType()
export class StoreOrder {
  @Field(() => String)
  id: string;

  @Field(() => String)
  schoolId: string;

  @Field(() => String)
  userId: string;

  @Field(() => Float)
  total: Prisma.Decimal;

  @Field(() => $Enums.StoreOrderStatus)
  status: $Enums.StoreOrderStatus;

  @Field(() => $Enums.StorePaymentStatus)
  paymentStatus: $Enums.StorePaymentStatus;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [StoreOrderItem])
  items: StoreOrderItem[];
}
