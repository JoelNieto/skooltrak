import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutStoreInput {
    @IsString()
  @IsNotEmpty()
  schoolId: string;

    @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
