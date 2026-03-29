import { $Enums } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';

@InputType()
export class UpdateStoreOrderStatusInput {
  @Field(() => String)
  @IsUUID()
  orderId: string;

  @Field(() => String)
  @IsEnum($Enums.StoreOrderStatus)
  status: $Enums.StoreOrderStatus;
}
