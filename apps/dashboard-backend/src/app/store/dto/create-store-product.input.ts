import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateStoreProductVariantInput } from './create-store-product-variant.input';

export class CreateStoreProductInput {
    @IsString()
  @IsNotEmpty()
  schoolId: string;

    @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

    @IsString()
  @MaxLength(300)
  name: string;

    @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

    @IsNumber()
  @Min(0)
  price: number;

    @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;

    @IsOptional()
  @IsBoolean()
  active?: boolean;

    @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStoreProductVariantInput)
  variants: CreateStoreProductVariantInput[];
}
