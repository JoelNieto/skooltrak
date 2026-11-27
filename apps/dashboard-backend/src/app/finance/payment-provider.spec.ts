import { CARD_DECLINED, INSUFFICIENT_FUNDS, MockCardProvider } from './payment-provider';

/** BR-FIN-001.12 test cards. */
describe('MockCardProvider', () => {
  const provider = new MockCardProvider();
  const charge = (last4: string) => provider.charge({ amount: 10_000, idempotencyKey: 'k', card: { brand: 'visa', last4, expMonth: 12, expYear: 2030 } });

  it('declines cards ending 0002 and 9995 and approves the rest', async () => {
    await expect(charge('0002')).resolves.toEqual({ approved: false, message: CARD_DECLINED });
    await expect(charge('9995')).resolves.toEqual({ approved: false, message: INSUFFICIENT_FUNDS });
    await expect(charge('4242')).resolves.toEqual({ approved: true, providerRef: expect.stringMatching(/^mock_[0-9a-f]{16}$/) });
  });
});
