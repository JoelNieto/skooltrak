import { IsString, MaxLength } from 'class-validator';

/** A reason for voiding a payment or cancelling a charge (FR-FIN-001.8, .16). Required; blank → 400. */
export class ReasonInput {
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class CancelledCharge {
  id: string;
  /** ISO timestamp. */
  cancelledAt: string;
  cancelReason: string;
}
