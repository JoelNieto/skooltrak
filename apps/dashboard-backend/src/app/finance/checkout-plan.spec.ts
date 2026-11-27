import {
  CHECKOUT_ALREADY_PAID,
  CHECKOUT_CANCELLED,
  CHECKOUT_EMPTY,
  CHECKOUT_FOREIGN_CHARGE,
  CHECKOUT_MINIMUM,
  CHECKOUT_ONE_PARTIAL,
  CHECKOUT_REPEATED,
  CheckoutError,
  planCheckout,
} from './checkout-plan';

/** FR-FIN-001.13 checkout lines (BR-FIN-001.11, .13), in cents. */
describe('planCheckout', () => {
  const charges = [
    { id: 'marzo', accountId: 'A1', outstanding: 28_500, cancelled: false },
    { id: 'abril', accountId: 'A1', outstanding: 28_500, cancelled: false },
    { id: 'pagado', accountId: 'A1', outstanding: 0, cancelled: false },
    { id: 'cancelado', accountId: 'A1', outstanding: 0, cancelled: true },
    { id: 'otra', accountId: 'A2', outstanding: 5_000, cancelled: false },
  ];
  const fails = (lines: { chargeId: string; amount: number }[], kind: string, message: string) => {
    let error: unknown;
    try {
      planCheckout('A1', lines, charges);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(CheckoutError);
    expect(error).toMatchObject({ kind, message });
  };

  it('pays several charges in full and one in part', () => {
    expect(planCheckout('A1', [{ chargeId: 'marzo', amount: 28_500 }, { chargeId: 'abril', amount: 10_000 }], charges)).toBe(38_500);
  });

  it('allows only one partial line and at least 1.00', () => {
    fails([{ chargeId: 'marzo', amount: 100 }, { chargeId: 'abril', amount: 100 }], 'bad_request', CHECKOUT_ONE_PARTIAL);
    fails([{ chargeId: 'marzo', amount: 99 }], 'bad_request', CHECKOUT_MINIMUM);
    fails([], 'bad_request', CHECKOUT_EMPTY);
    fails([{ chargeId: 'marzo', amount: 100 }, { chargeId: 'marzo', amount: 100 }], 'bad_request', CHECKOUT_REPEATED);
  });

  it("refuses another account's charges (403) and paid or cancelled ones (409)", () => {
    fails([{ chargeId: 'otra', amount: 5_000 }], 'forbidden', CHECKOUT_FOREIGN_CHARGE);
    fails([{ chargeId: 'missing', amount: 5_000 }], 'forbidden', CHECKOUT_FOREIGN_CHARGE);
    fails([{ chargeId: 'pagado', amount: 100 }], 'conflict', CHECKOUT_ALREADY_PAID);
    fails([{ chargeId: 'marzo', amount: 28_501 }], 'conflict', CHECKOUT_ALREADY_PAID);
    fails([{ chargeId: 'cancelado', amount: 100 }], 'conflict', CHECKOUT_CANCELLED);
  });
});
