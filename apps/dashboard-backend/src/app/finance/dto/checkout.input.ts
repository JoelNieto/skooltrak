import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'other'] as const;

/**
 * What the browser sends about the card (BR-FIN-001.12): never the number or the CVV. The route
 * refuses any other property, so a client that tries to send them gets 400.
 */
export class CheckoutCardInput {
  @ApiProperty({ enum: CARD_BRANDS })
  @IsIn(CARD_BRANDS)
  brand: (typeof CARD_BRANDS)[number];

  @Matches(/^\d{4}$/)
  last4: string;

  @IsInt()
  @Min(1)
  @Max(12)
  expMonth: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  expYear: number;
}

export class CheckoutLineInput {
  @IsString()
  @IsNotEmpty()
  chargeId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

/** FR-FIN-001.13: a guardian pays charges of one family account by card. */
export class CheckoutInput {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  /** One per attempt; a retry with the same key returns the first result (BR-FIN-001.13). */
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  idempotencyKey: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineInput)
  lines: CheckoutLineInput[];

  @ValidateNested()
  @Type(() => CheckoutCardInput)
  card: CheckoutCardInput;
}
