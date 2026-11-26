/**
 * Charge status is derived, never stored (BR-FIN-001.10). Amounts are handled in cents so
 * Decimal(12,2) values add up exactly.
 */

export type ChargeStatus = 'PENDING' | 'PARTIAL' | 'OVERDUE' | 'PAID' | 'CANCELLED';

type DecimalLike = { toNumber(): number } | number | string;

export interface ChargeAmounts {
  netAmount: DecimalLike;
  paidAmount: DecimalLike;
  /** A `@db.Date` value: midnight UTC of the due day. */
  dueDate: Date;
  cancelledAt: Date | null;
}

/** Cents of a Decimal(12,2) value. */
export function cents(value: DecimalLike): number {
  const n = typeof value === 'object' ? value.toNumber() : Number(value);
  return Math.round(n * 100);
}

/** Amount in currency units from cents. */
export function fromCents(value: number): number {
  return value / 100;
}

export function outstandingCents(charge: ChargeAmounts): number {
  if (charge.cancelledAt) return 0;
  return Math.max(0, cents(charge.netAmount) - cents(charge.paidAmount));
}

/** `today` is the school-local date as `YYYY-MM-DD`; a charge due today is not overdue yet. */
export function chargeStatus(charge: ChargeAmounts, today: string): ChargeStatus {
  if (charge.cancelledAt) return 'CANCELLED';
  const open = outstandingCents(charge);
  if (open === 0) return 'PAID';
  if (charge.dueDate.toISOString().slice(0, 10) < today) return 'OVERDUE';
  return cents(charge.paidAmount) > 0 ? 'PARTIAL' : 'PENDING';
}

/** Account display number: C-0042. */
export function accountNumber(n: number): string {
  return `C-${String(n).padStart(4, '0')}`;
}
