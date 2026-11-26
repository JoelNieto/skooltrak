import { accountNumber, chargeStatus, outstandingCents } from './charge-status';

const charge = (net: string, paid: string, due: string, cancelled = false) => ({
  netAmount: net,
  paidAmount: paid,
  dueDate: new Date(`${due}T00:00:00Z`),
  cancelledAt: cancelled ? new Date() : null,
});

describe('chargeStatus (BR-FIN-001.10)', () => {
  const today = '2026-11-26';

  it('derives each status from amounts, due date and cancellation', () => {
    expect(chargeStatus(charge('240.00', '0', '2026-12-05'), today)).toBe('PENDING');
    expect(chargeStatus(charge('240.00', '120.00', '2026-12-05'), today)).toBe('PARTIAL');
    expect(chargeStatus(charge('240.00', '120.00', '2026-11-05'), today)).toBe('OVERDUE');
    expect(chargeStatus(charge('240.00', '240.00', '2026-11-05'), today)).toBe('PAID');
    expect(chargeStatus(charge('240.00', '0', '2026-11-05', true), today)).toBe('CANCELLED');
  });

  it('is not overdue on its due day', () => {
    expect(chargeStatus(charge('10', '0', today), today)).toBe('PENDING');
  });

  it('counts in cents, so 0.1 + 0.2 style sums stay exact', () => {
    expect(outstandingCents(charge('0.30', '0.10', today))).toBe(20);
    expect(outstandingCents(charge('5', '9', today))).toBe(0); // never negative
    expect(outstandingCents(charge('5', '0', today, true))).toBe(0);
  });

  it('formats account numbers', () => {
    expect(accountNumber(142)).toBe('C-0142');
    expect(accountNumber(12345)).toBe('C-12345');
  });
});
