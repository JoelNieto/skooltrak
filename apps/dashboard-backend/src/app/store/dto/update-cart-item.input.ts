import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UpdateCartItemInput {
    @IsString()
  @IsNotEmpty()
  cartItemId: string;

    @IsInt()
  @Min(1)
  quantity: number;
}
