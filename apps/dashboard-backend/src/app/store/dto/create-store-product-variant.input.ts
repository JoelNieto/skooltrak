import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateStoreProductVariantInput {
    @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label: string;

    @IsInt()
  @Min(0)
  stock: number;

    @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
