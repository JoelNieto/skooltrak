/**
 * Card checks done in the browser (BR-FIN-001.12): the number and CVV never leave this page.
 * The API gets the brand, the last 4 digits and the expiry only.
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'other';

export const CARD_BRAND_LABEL: Record<CardBrand, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', other: 'Tarjeta' };

/** Digits only. */
export function cardDigits(value: string): string {
  return (value ?? '').replace(/\D/g, '');
}

export function luhnValid(value: string): boolean {
  const digits = cardDigits(value);
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function cardBrand(value: string): CardBrand {
  const digits = cardDigits(value);
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'other';
}

/** "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(value: string): string {
  const digits = cardDigits(value).slice(0, 19);
  const groups = cardBrand(digits) === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const out: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + g));
    i += g;
  }
  return out.join(' ');
}

/** `MM/AA` → month and four-digit year, or null when malformed. */
export function parseExpiry(value: string): { month: number; year: number } | null {
  const m = /^\s*(\d{1,2})\s*\/\s*(\d{2})\s*$/.exec(value ?? '');
  if (!m) return null;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return null;
  return { month, year: 2000 + Number(m[2]) };
}

/** Expired when its month is before `today` (`YYYY-MM-DD`). */
export function expired(exp: { month: number; year: number }, today: string): boolean {
  return `${exp.year}-${String(exp.month).padStart(2, '0')}` < today.slice(0, 7);
}

/** The test cards shown in "Modo de prueba" (BR-FIN-001.12). */
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', outcome: 'Aprobada' },
  { number: '4000 0000 0000 0002', outcome: 'Rechazada' },
  { number: '4000 0000 0000 9995', outcome: 'Fondos insuficientes' },
];
