import { expect, Page, test } from '@playwright/test';
import { data, storageStatePath } from '../support/fixtures';

/**
 * FIN-001-S04 — family checkout with the mock card.
 * docs/product/slices/FIN-001-S04-family-checkout-mock-card.md
 *
 * Runs in `after-checkout`, after S03 (receipts R-000001/2). "Familia E2E" still owes its
 * `data.charge` (285.00): the guardian is declined, pays 100.00 by card, then the API pays the rest.
 */

test.describe.configure({ mode: 'serial' });

const mensualidad = data.charge.description;
const nextYear = String(new Date().getFullYear() + 1).slice(-2);

async function token(page: Page) {
  return page.evaluate(() => localStorage.getItem('access_token'));
}

async function payWithCard(page: Page, number: string) {
  await page.goto('/parent/finances');
  await page.getByLabel(`Seleccionar ${mensualidad}`).check();
  await page.getByTestId('pay-bar').getByRole('button', { name: /^Pagar \(1\)/ }).click();
  await expect(page).toHaveURL(/\/parent\/finances\/pay\?/);
  await expect(page.getByTestId('pay-line')).toContainText(mensualidad);
  await page.getByLabel(`Monto a pagar de ${mensualidad}`).fill('100');
  await page.getByLabel(`Monto a pagar de ${mensualidad}`).blur();
  await expect(page.getByTestId('pay-total')).toContainText('100.00');
  await page.getByLabel('Nombre en la tarjeta').fill('Paula Padre');
  await page.getByLabel('Número de tarjeta').fill(number);
  await page.getByLabel('Vencimiento (MM/AA)').fill(`12/${nextYear}`);
  await page.getByLabel('CVV').fill('123');
  await page.getByRole('button', { name: /^Pagar \$100\.00/ }).click();
}

test.describe('Family checkout (guardian)', () => {
  test.use({ storageState: storageStatePath('parent') });

  test('a declined card charges nothing @FR-FIN-001.13', async ({ page }) => {
    await payWithCard(page, '4000 0000 0000 0002');
    await expect(page.getByTestId('pay-error')).toHaveText('Tarjeta rechazada');

    await page.goto('/parent/finances');
    await expect(page.getByTestId('parent-charge').filter({ hasText: mensualidad })).toContainText('285.00');
  });

  test('pays part of a charge by card and shows the receipt @FR-FIN-001.13 @FR-FIN-001.15', async ({ page }) => {
    await payWithCard(page, '4242 4242 4242 4242');

    await expect(page).toHaveURL(/\/parent\/finances\/receipts\//);
    // The decline above used no number (BR-FIN-001.16).
    await expect(page.getByTestId('receipt-number')).toHaveText('R-000003');
    await expect(page.getByTestId('receipt-method')).toHaveText('Tarjeta');
    await expect(page.getByTestId('receipt-reference')).toContainText('···· 4242');
    await expect(page.getByTestId('receipt-line')).toContainText(mensualidad);
    await expect(page.getByTestId('receipt-total')).toContainText('100.00');

    await page.goto('/parent/finances');
    const charge = page.getByTestId('parent-charge').filter({ hasText: mensualidad });
    await expect(charge).toContainText('185.00');
    await expect(charge).toContainText('pagado $100.00');
  });

  test('a retry with the same key pays once; a paid charge is refused @FR-FIN-001.13', async ({ page }) => {
    await page.goto('/parent/finances');
    const headers = { Authorization: `Bearer ${await token(page)}` };
    const accounts = (await (await page.request.get('/api/v1/finance/me/accounts', { headers })).json()) as {
      id: string;
      charges: { id: string; description: string; outstanding: number }[];
    }[];
    const account = accounts[0];
    const charge = account.charges.find((c) => c.description === mensualidad)!;
    expect(charge.outstanding).toBe(185);

    const card = { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2000 + Number(nextYear) };
    const body = { accountId: account.id, idempotencyKey: `e2e-retry-${Date.now()}`, lines: [{ chargeId: charge.id, amount: 185 }], card };
    const first = await (await page.request.post('/api/v1/finance/me/checkout', { headers, data: body })).json();
    const second = await (await page.request.post('/api/v1/finance/me/checkout', { headers, data: body })).json();
    expect(first.status).toBe('COMPLETED');
    expect(second.receipt.id).toBe(first.receipt.id);
    expect(second.receipt.receiptNumber).toBe('R-000004');

    const again = await page.request.post('/api/v1/finance/me/checkout', {
      headers,
      data: { ...body, idempotencyKey: `e2e-again-${Date.now()}`, lines: [{ chargeId: charge.id, amount: 1 }] },
    });
    expect(again.status()).toBe(409);
    expect((await again.json()).message).toBe('Uno de los cargos ya fue pagado');

    // The card number never reaches the API (BR-FIN-001.12).
    const withNumber = await page.request.post('/api/v1/finance/me/checkout', {
      headers,
      data: { ...body, idempotencyKey: `e2e-pan-${Date.now()}`, card: { ...card, number: '4242424242424242' } },
    });
    expect(withNumber.status()).toBe(400);
  });
});

test.describe('Checkout access', () => {
  test("a guardian can't pay another family's account; teachers and admins can't pay @FR-FIN-001.13", async ({ browser }) => {
    // Account ids, read as the admin: Carla's (another family) and "Familia E2E".
    const admin = await browser.newContext({ storageState: storageStatePath('admin') });
    const adminPage = await admin.newPage();
    await adminPage.goto('/financial-module/accounts');
    const accountId = async (search: string) => {
      await adminPage.getByRole('searchbox', { name: 'Buscar cuenta' }).fill(search);
      await expect(adminPage.getByTestId('account-row')).toHaveCount(1);
      return (await adminPage.getByTestId('account-row').getByRole('link').first().getAttribute('href'))!.split('/').pop()!;
    };
    const carlaAccount = await accountId(data.relatedStudents[2]);
    const familyAccount = await accountId(data.relatedStudents[0]);
    const adminHeaders = { Authorization: `Bearer ${await token(adminPage)}` };

    const card = { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2000 + Number(nextYear) };
    const attempt = (accountId: string) => ({
      accountId,
      idempotencyKey: `e2e-access-${accountId}-${Date.now()}`,
      lines: [{ chargeId: 'any', amount: 10 }],
      card,
    });

    // Admins hold every permission, but only the account's guardians pay it.
    const asAdmin = await adminPage.request.post('/api/v1/finance/me/checkout', { headers: adminHeaders, data: attempt(familyAccount) });
    expect(asAdmin.status()).toBe(403);
    await admin.close();

    for (const persona of ['parent', 'teacher'] as const) {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const page = await context.newPage();
      await page.goto('/');
      const res = await page.request.post('/api/v1/finance/me/checkout', {
        headers: { Authorization: `Bearer ${await token(page)}` },
        data: attempt(persona === 'parent' ? carlaAccount : familyAccount),
      });
      expect(res.status()).toBe(403);
      await context.close();
    }
  });
});
