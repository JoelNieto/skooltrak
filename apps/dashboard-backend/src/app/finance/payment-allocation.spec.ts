import {
  ALLOCATION_INVALID,
  ALLOCATIONS_EXCEED_PAYMENT,
  CHARGE_CANCELLED,
  CHARGE_EXCEEDED,
  CHARGE_NOT_IN_ACCOUNT,
  CHARGE_REPEATED,
  planAllocation,
  receiptNumber,
} from './payment-allocation';

/** FR-FIN-001.14 allocations (BR-FIN-001.3, .15), in cents. */
describe('planAllocation', () => {
  const charges = [
    { id: 'matricula', accountId: 'A1', outstanding: 15_000, cancelled: false },
    { id: 'marzo', accountId: 'A1', outstanding: 28_500, cancelled: false },
    { id: 'cancelado', accountId: 'A1', outstanding: 0, cancelled: true },
    { id: 'otra-cuenta', accountId: 'A2', outstanding: 5_000, cancelled: false },
  ];

  it('allocates to charges and turns the rest into saldo a favor', () => {
    expect(planAllocation(20_000, 'A1', [{ chargeId: 'matricula', amount: 15_000 }, { chargeId: 'marzo', amount: 2_000 }], charges)).toEqual({
      allocations: [
        { chargeId: 'matricula', amount: 15_000 },
        { chargeId: 'marzo', amount: 2_000 },
      ],
      credit: 3_000,
    });
    expect(planAllocation(5_000, 'A1', [], charges)).toEqual({ allocations: [], credit: 5_000 });
  });

  it('never pays more than a charge owes or than the payment', () => {
    expect(() => planAllocation(20_000, 'A1', [{ chargeId: 'matricula', amount: 15_001 }], charges)).toThrow(CHARGE_EXCEEDED);
    expect(() =>
      planAllocation(20_000, 'A1', [{ chargeId: 'matricula', amount: 15_000 }, { chargeId: 'marzo', amount: 5_001 }], charges),
    ).toThrow(ALLOCATIONS_EXCEED_PAYMENT);
  });

  it("refuses other accounts' charges, cancelled or repeated charges and empty amounts", () => {
    expect(() => planAllocation(5_000, 'A1', [{ chargeId: 'otra-cuenta', amount: 100 }], charges)).toThrow(CHARGE_NOT_IN_ACCOUNT);
    expect(() => planAllocation(5_000, 'A1', [{ chargeId: 'missing', amount: 100 }], charges)).toThrow(CHARGE_NOT_IN_ACCOUNT);
    expect(() => planAllocation(5_000, 'A1', [{ chargeId: 'cancelado', amount: 100 }], charges)).toThrow(CHARGE_CANCELLED);
    expect(() =>
      planAllocation(5_000, 'A1', [{ chargeId: 'marzo', amount: 100 }, { chargeId: 'marzo', amount: 100 }], charges),
    ).toThrow(CHARGE_REPEATED);
    expect(() => planAllocation(5_000, 'A1', [{ chargeId: 'marzo', amount: 0 }], charges)).toThrow(ALLOCATION_INVALID);
  });

  it('formats receipt numbers', () => {
    expect(receiptNumber(1)).toBe('R-000001');
    expect(receiptNumber(123_456)).toBe('R-123456');
  });
});
