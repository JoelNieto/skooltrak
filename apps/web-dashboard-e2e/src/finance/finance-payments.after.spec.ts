import { expect, Page, test } from '@playwright/test';
import { data, storageStatePath } from '../support/fixtures';

/**
 * FIN-001-S03 — offline payments (Transferencia/ACH, Yappy) and receipts.
 * docs/product/slices/FIN-001-S03-offline-payments-receipts.md
 *
 * Runs in the `after-finance` project, once the S01/S02 specs that assert these accounts' balances
 * are done. No other spec registers payments, so receipt numbers start at R-000001.
 */

test.describe.configure({ mode: 'serial' });

const { transfer, yappy } = data.finance;
const carla = data.relatedStudents[2];
let carlaPaymentId = '';
/** Yesterday (UTC): never after the school's today, whatever the runner's time zone. */
const receivedAt = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

async function openAccount(page: Page, search: string) {
  await page.goto('/financial-module/accounts');
  await page.getByRole('searchbox', { name: 'Buscar cuenta' }).fill(search);
  await expect(page.getByTestId('account-row')).toHaveCount(1);
  await page.getByTestId('account-row').getByRole('link').first().click();
  await expect(page.getByTestId('account-header')).toBeVisible();
}

async function openPaymentDialog(page: Page) {
  await page.getByRole('button', { name: 'Registrar pago' }).click();
  return page.getByRole('dialog').filter({ hasText: 'Registrar pago' });
}

test.describe('Offline payments (admin)', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('registers a transfer, oldest charge first, and shows its receipt @FR-FIN-001.14 @FR-FIN-001.15', async ({ page }) => {
    await openAccount(page, carla);
    await expect(page.getByTestId('overdue-amount')).toContainText(String(data.admin.overdueCharge.amount));

    const dialog = await openPaymentDialog(page);
    await dialog.getByLabel('Método').selectOption({ label: 'Transferencia / ACH' });
    await dialog.getByLabel('Monto', { exact: true }).fill(String(transfer.amount));
    await dialog.getByLabel('Referencia').fill(transfer.reference);
    await dialog.getByLabel('Fecha de recepción').fill(receivedAt);
    // The overdue Matrícula is the oldest open charge, so it takes the whole amount.
    await expect(dialog.getByLabel(`Pagar ${data.admin.overdueCharge.description}`)).toBeChecked();
    await expect(dialog.getByLabel(`Monto para ${data.admin.overdueCharge.description}`)).toHaveValue('150.00');
    await expect(dialog.getByTestId('payment-credit')).toContainText('0.00');
    await dialog.getByRole('button', { name: 'Registrar pago' }).click();

    await expect(page).toHaveURL(/\/financial-module\/payments\/[^/]+$/);
    carlaPaymentId = page.url().split('/').pop()!;
    const receipt = page.getByTestId('receipt');
    await expect(receipt.getByTestId('receipt-number')).toHaveText('R-000001');
    await expect(receipt.getByTestId('receipt-method')).toHaveText('Transferencia / ACH');
    await expect(receipt.getByTestId('receipt-reference')).toHaveText(transfer.reference);
    await expect(receipt.getByTestId('receipt-line')).toHaveCount(1);
    await expect(receipt.getByTestId('receipt-line')).toContainText(data.admin.overdueCharge.description);
    await expect(receipt.getByTestId('receipt-total')).toContainText('150.00');

    await openAccount(page, carla);
    await expect(page.getByTestId('charge-row').filter({ hasText: data.admin.overdueCharge.description })).toContainText('Pagado');
    await expect(page.getByTestId('overdue-amount')).toContainText('0.00');
    await expect(page.getByTestId('account-payment-row')).toContainText('R-000001');
  });

  test('refuses a reference already registered, without using a receipt number @FR-FIN-001.14', async ({ page }) => {
    await openAccount(page, carla);
    const dialog = await openPaymentDialog(page);
    await dialog.getByLabel('Monto', { exact: true }).fill('10');
    await dialog.getByLabel('Referencia').fill(transfer.reference);
    await dialog.getByRole('button', { name: 'Registrar pago' }).click();
    await expect(page.getByText('Referencia ya registrada')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
  });

  test('turns what is not allocated into saldo a favor @FR-FIN-001.14 @FR-FIN-001.15', async ({ page }) => {
    await openAccount(page, data.relatedStudents[1]);
    const dialog = await openPaymentDialog(page);
    await dialog.getByLabel('Método').selectOption({ label: 'Yappy' });
    await dialog.getByLabel('Monto', { exact: true }).fill(String(yappy.amount));
    await dialog.getByLabel('Referencia').fill(yappy.reference);
    await dialog.getByLabel('Fecha de recepción').fill(receivedAt);
    // Pay only Beto's Excursión: drop the suggested Mensualidad (due sooner), pick the Excursión.
    await dialog.getByLabel(`Pagar ${data.charge.description}`).uncheck();
    await dialog.getByLabel(`Pagar ${data.finance.manualCharge.description}`).check();
    await expect(dialog.getByLabel(`Monto para ${data.finance.manualCharge.description}`)).toHaveValue('25.00');
    await expect(dialog.getByTestId('payment-credit')).toContainText('5.00');
    await dialog.getByRole('button', { name: 'Registrar pago' }).click();

    const receipt = page.getByTestId('receipt');
    // The refused payment above used no number: no gaps (BR-FIN-001.16).
    await expect(receipt.getByTestId('receipt-number')).toHaveText('R-000002');
    await expect(receipt.getByTestId('receipt-method')).toHaveText('Yappy');
    await expect(receipt.getByTestId('receipt-line')).toContainText(data.finance.manualCharge.description);
    await expect(receipt.getByTestId('receipt-credit')).toContainText('5.00');
    await expect(receipt.getByTestId('receipt-total')).toContainText('30.00');

    await openAccount(page, data.relatedStudents[1]);
    await expect(page.getByTestId('credit-amount')).toContainText('5.00');
  });

  test('lists both payments under Pagos @FR-FIN-001.15', async ({ page }) => {
    await page.goto('/financial-module/payments');
    const rows = page.getByTestId('payment-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText('R-000002');
    await page.getByLabel('Método').selectOption({ label: 'Yappy' });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(yappy.reference);
  });
});

test.describe('Receipts (guardian)', () => {
  test.use({ storageState: storageStatePath('parent') });

  test("sees the family's payments and opens a receipt, never another family's @FR-FIN-001.15", async ({ page }) => {
    await page.goto('/parent/finances');
    await expect(page.getByTestId('parent-credit')).toContainText('5.00');
    const payment = page.getByTestId('parent-payment');
    await expect(payment).toHaveCount(1);
    await expect(payment).toContainText('R-000002');
    await payment.getByRole('link').click();
    await expect(page).toHaveURL(/\/parent\/finances\/receipts\//);
    await expect(page.getByTestId('receipt-line')).toContainText(data.finance.manualCharge.description);

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const other = await page.request.get(`/api/v1/finance/payments/${carlaPaymentId}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(other.status()).toBe(403);
  });
});

test.describe('Payment access', () => {
  for (const persona of ['parent', 'teacher'] as const) {
    test(`a ${persona} cannot register payments @FR-FIN-001.14`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const page = await context.newPage();
      await page.goto('/');
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      const res = await page.request.post('/api/v1/finance/payments', {
        headers: { Authorization: `Bearer ${token}` },
        data: { accountId: 'any', method: 'YAPPY', amount: 10, receivedAt: '2026-01-01', reference: 'X', allocations: [] },
      });
      expect(res.status()).toBe(403);
      await context.close();
    });
  }
});
