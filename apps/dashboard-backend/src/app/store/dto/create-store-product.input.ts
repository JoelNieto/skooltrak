import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

@InputType()
export class CreateStoreProductInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @Field(() => String)
  @IsString()
  @MaxLength(300)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  stock: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
