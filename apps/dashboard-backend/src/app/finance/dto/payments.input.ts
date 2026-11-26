import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export const OFFLINE_METHODS = ['BANK_TRANSFER', 'YAPPY'] as const;
export type OfflineMethod = (typeof OFFLINE_METHODS)[number];

export class PaymentAllocationInput {
  @IsString()
  @IsNotEmpty()
  chargeId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

/**
 * An offline payment registered by staff (FR-FIN-001.14). Whatever the allocations leave of the
 * amount becomes saldo a favor (BR-FIN-001.15).
 */
export class RegisterPaymentInput {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ enum: OFFLINE_METHODS })
  @IsIn(OFFLINE_METHODS)
  method: OfflineMethod;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  /** `YYYY-MM-DD`, not after the school's today. */
  @IsDateString({ strict: true })
  receivedAt: string;

  /** Transfer number or Yappy transaction id (BR-FIN-001.14). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  reference: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationInput)
  allocations: PaymentAllocationInput[];
}
