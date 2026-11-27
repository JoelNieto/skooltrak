/**
 * Checks a guardian's checkout against the charges locked in the transaction (FR-FIN-001.13,
 * BR-FIN-001.11, .13). Pure, in cents.
 *
 * - At least one line, each a different charge of the account, > 0.
 * - A charge already paid (or paid below the requested amount meanwhile) → conflict.
 * - Only one line may pay less than what its charge owes; the total is at least 1.00.
 */

export const CHECKOUT_EMPTY = 'Selecciona al menos un cargo';
export const CHECKOUT_MINIMUM = 'El pago mínimo en línea es 1.00';
export const CHECKOUT_ONE_PARTIAL = 'Solo un cargo puede pagarse en parte';
export const CHECKOUT_FOREIGN_CHARGE = 'Los cargos deben ser de tu cuenta';
export const CHECKOUT_ALREADY_PAID = 'Uno de los cargos ya fue pagado';
export const CHECKOUT_REPEATED = 'Un cargo aparece más de una vez';
export const CHECKOUT_CANCELLED = 'Uno de los cargos fue cancelado';
export const CHECKOUT_LINE_INVALID = 'Cada monto debe ser mayor que cero';

export const MIN_ONLINE_CENTS = 100;

export type CheckoutErrorKind = 'bad_request' | 'forbidden' | 'conflict';

export class CheckoutError extends Error {
  constructor(
    readonly kind: CheckoutErrorKind,
    message: string,
  ) {
    super(message);
  }
}

export interface CheckoutLine {
  chargeId: string;
  /** Cents. */
  amount: number;
}

export interface CheckoutCharge {
  id: string;
  accountId: string;
  /** Cents still due. */
  outstanding: number;
  cancelled: boolean;
}

/** Validates the lines and returns the total in cents. */
export function planCheckout(accountId: string, lines: CheckoutLine[], charges: CheckoutCharge[]): number {
  if (!lines.length) throw new CheckoutError('bad_request', CHECKOUT_EMPTY);
  const byId = new Map(charges.map((c) => [c.id, c]));
  const seen = new Set<string>();
  let partials = 0;
  let total = 0;
  for (const line of lines) {
    if (seen.has(line.chargeId)) throw new CheckoutError('bad_request', CHECKOUT_REPEATED);
    seen.add(line.chargeId);
    if (!Number.isInteger(line.amount) || line.amount <= 0) throw new CheckoutError('bad_request', CHECKOUT_LINE_INVALID);
    const charge = byId.get(line.chargeId);
    if (!charge || charge.accountId !== accountId) throw new CheckoutError('forbidden', CHECKOUT_FOREIGN_CHARGE);
    if (charge.cancelled) throw new CheckoutError('conflict', CHECKOUT_CANCELLED);
    if (charge.outstanding === 0 || line.amount > charge.outstanding) throw new CheckoutError('conflict', CHECKOUT_ALREADY_PAID);
    if (line.amount < charge.outstanding) partials++;
    total += line.amount;
  }
  if (partials > 1) throw new CheckoutError('bad_request', CHECKOUT_ONE_PARTIAL);
  if (total < MIN_ONLINE_CENTS) throw new CheckoutError('bad_request', CHECKOUT_MINIMUM);
  return total;
}
