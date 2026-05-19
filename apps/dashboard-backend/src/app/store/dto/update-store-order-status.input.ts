import { $Enums } from '@generated/prisma';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateStoreOrderStatusInput {
    @IsString()
  @IsNotEmpty()
  orderId: string;

    @IsEnum($Enums.StoreOrderStatus)
  status: $Enums.StoreOrderStatus;
}
