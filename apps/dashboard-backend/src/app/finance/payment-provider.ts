import { randomUUID } from 'crypto';

/**
 * Card payments go through a provider (BR-FIN-001.12). v1 ships the mock only; credit cards and
 * Yappy online are future providers. The provider never sees a card number: the browser keeps it
 * and sends brand, last 4 and expiry, which stand in for a provider token.
 */
export interface CardDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface ChargeCardRequest {
  /** Cents. */
  amount: number;
  card: CardDetails;
  idempotencyKey: string;
}

export type ChargeCardResult = { approved: true; providerRef: string } | { approved: false; message: string };

export interface PaymentProvider {
  readonly name: string;
  charge(request: ChargeCardRequest): Promise<ChargeCardResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export const CARD_DECLINED = 'Tarjeta rechazada';
export const INSUFFICIENT_FUNDS = 'Fondos insuficientes';

/** BR-FIN-001.12 test cards: ending 0002 → declined, 9995 → insufficient funds, else approved. */
export class MockCardProvider implements PaymentProvider {
  readonly name = 'mock';

  async charge({ card }: ChargeCardRequest): Promise<ChargeCardResult> {
    if (card.last4 === '0002') return { approved: false, message: CARD_DECLINED };
    if (card.last4 === '9995') return { approved: false, message: INSUFFICIENT_FUNDS };
    return { approved: true, providerRef: `mock_${randomUUID().replace(/-/g, '').slice(0, 16)}` };
  }
}
