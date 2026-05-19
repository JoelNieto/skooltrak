import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessStorePaymentInput {
    @IsString()
  @IsNotEmpty()
  orderId: string;

  /** Simulate failed payment when false (default: success). */
    @IsOptional()
  @IsBoolean()
  simulateSuccess?: boolean;
}
