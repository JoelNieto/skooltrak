/**
 * Checks how a payment is spread over an account's charges (FR-FIN-001.14, BR-FIN-001.3, .15).
 * Pure, in cents: PaymentsService feeds it the charges it locked inside the transaction.
 *
 * - Each allocation goes to a different, non-cancelled charge of the payment's account, is > 0 and
 *   never more than the charge's outstanding amount.
 * - Allocations never add up to more than the payment; what is left becomes saldo a favor.
 */

export const CHARGE_EXCEEDED = 'El monto excede el saldo del cargo';
export const ALLOCATIONS_EXCEED_PAYMENT = 'Las asignaciones superan el monto del pago';
export const CHARGE_NOT_IN_ACCOUNT = 'El cargo no pertenece a esta cuenta';
export const CHARGE_CANCELLED = 'El cargo está cancelado';
export const CHARGE_REPEATED = 'Un cargo aparece más de una vez';
export const ALLOCATION_INVALID = 'Cada monto asignado debe ser mayor que cero';

export interface AllocationRequest {
  chargeId: string;
  /** Cents. */
  amount: number;
}

export interface LockedCharge {
  id: string;
  accountId: string;
  /** Cents still due. */
  outstanding: number;
  cancelled: boolean;
}

export interface AllocationPlan {
  allocations: AllocationRequest[];
  /** Cents left over: saldo a favor. */
  credit: number;
}

export class AllocationError extends Error {}

export function planAllocation(
  paymentCents: number,
  accountId: string,
  requests: AllocationRequest[],
  charges: LockedCharge[],
): AllocationPlan {
  const byId = new Map(charges.map((c) => [c.id, c]));
  const seen = new Set<string>();
  let total = 0;
  for (const r of requests) {
    if (seen.has(r.chargeId)) throw new AllocationError(CHARGE_REPEATED);
    seen.add(r.chargeId);
    if (!Number.isInteger(r.amount) || r.amount <= 0) throw new AllocationError(ALLOCATION_INVALID);
    const charge = byId.get(r.chargeId);
    if (!charge || charge.accountId !== accountId) throw new AllocationError(CHARGE_NOT_IN_ACCOUNT);
    if (charge.cancelled) throw new AllocationError(CHARGE_CANCELLED);
    if (r.amount > charge.outstanding) throw new AllocationError(CHARGE_EXCEEDED);
    total += r.amount;
  }
  if (total > paymentCents) throw new AllocationError(ALLOCATIONS_EXCEED_PAYMENT);
  return { allocations: requests, credit: paymentCents - total };
}

/** "R-000123" (BR-FIN-001.16). */
export function receiptNumber(n: number): string {
  return `R-${String(n).padStart(6, '0')}`;
}
