import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateStoreCategoryInput {
    @IsString()
  @IsNotEmpty()
  schoolId: string;

    @IsString()
  @MaxLength(200)
  name: string;

    @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

    @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
