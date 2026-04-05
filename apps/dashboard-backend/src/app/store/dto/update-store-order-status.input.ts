import { $Enums } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateStoreOrderStatusInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @Field(() => String)
  @IsEnum($Enums.StoreOrderStatus)
  status: $Enums.StoreOrderStatus;
}
