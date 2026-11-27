import { describe, expect, it } from 'vitest';
import { cardBrand, expired, formatCardNumber, luhnValid, parseExpiry } from './card';

describe('card checks (BR-FIN-001.12)', () => {
  it('validates numbers with Luhn', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBe(true);
    expect(luhnValid('4000 0000 0000 0002')).toBe(true);
    expect(luhnValid('4000 0000 0000 9995')).toBe(true);
    expect(luhnValid('4242 4242 4242 4241')).toBe(false);
    expect(luhnValid('4242')).toBe(false);
  });

  it('detects the brand and groups the digits', () => {
    expect(cardBrand('4242')).toBe('visa');
    expect(cardBrand('5555 5555')).toBe('mastercard');
    expect(cardBrand('3782 822463 10005')).toBe('amex');
    expect(cardBrand('6011')).toBe('other');
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
  });

  it('parses and checks the expiry', () => {
    expect(parseExpiry('12/30')).toEqual({ month: 12, year: 2030 });
    expect(parseExpiry('13/30')).toBeNull();
    expect(parseExpiry('1230')).toBeNull();
    expect(expired({ month: 10, year: 2026 }, '2026-11-26')).toBe(true);
    expect(expired({ month: 11, year: 2026 }, '2026-11-26')).toBe(false);
  });
});
