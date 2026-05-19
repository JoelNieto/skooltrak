import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddToCartInput {
    @IsString()
  @IsNotEmpty()
  variantId: string;

    @IsInt()
  @Min(1)
  quantity: number;
}
