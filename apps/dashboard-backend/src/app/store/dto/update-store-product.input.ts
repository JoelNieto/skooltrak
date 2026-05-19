import { Type } from 'class-transformer';
import {
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
import { UpdateStoreProductVariantInput } from './update-store-product-variant.input';

export class UpdateStoreProductInput {
    @IsString()
  @IsNotEmpty()
  id: string;

    @IsOptional()
  @IsString()
  categoryId?: string | null;

    @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

    @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

    @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

    @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string | null;

    @IsOptional()
  @IsBoolean()
  active?: boolean;

    @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStoreProductVariantInput)
  variants?: UpdateStoreProductVariantInput[];
}
