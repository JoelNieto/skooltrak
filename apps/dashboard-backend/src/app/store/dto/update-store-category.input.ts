import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateStoreCategoryInput {
    @IsString()
  @IsNotEmpty()
  id: string;

    @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

    @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

    @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

    @IsOptional()
  @IsBoolean()
  active?: boolean;
}
