import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID, Min } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field(() => String)
  @IsUUID()
  cartItemId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}
