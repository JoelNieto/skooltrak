import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

@InputType()
export class CreateStoreProductVariantInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  stock: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
