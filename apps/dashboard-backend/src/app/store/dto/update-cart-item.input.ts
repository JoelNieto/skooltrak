import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  cartItemId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}
