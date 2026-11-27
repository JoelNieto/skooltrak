import { expect, Page, test } from '@playwright/test';
import { data, storageStatePath } from '../support/fixtures';

/**
 * FIN-001-S05 — void a payment and cancel a charge.
 * docs/product/slices/FIN-001-S05-void-payment-cancel-charge.md
 *
 * Runs in `after-void`, after S03/S04 made these payments: R-000001 (transfer, Carla's Matrícula),
 * R-000002 (Yappy, Beto's Excursión + 5.00 saldo a favor), R-000003/4 (cards, Ana's Mensualidad).
 */

test.describe.configure({ mode: 'serial' });

const carla = data.relatedStudents[2];
const matricula = data.admin.overdueCharge.description;
const excursion = data.finance.manualCharge.description;

async function openAccount(page: Page, search: string) {
  await page.goto('/financial-module/accounts');
  await page.getByRole('searchbox', { name: 'Buscar cuenta' }).fill(search);
  await expect(page.getByTestId('account-row')).toHaveCount(1);
  await page.getByTestId('account-row').getByRole('link').first().click();
  await expect(page.getByTestId('account-header')).toBeVisible();
}

async function openReceipt(page: Page, number: string) {
  await page.goto('/financial-module/payments');
  await page.getByRole('link', { name: number, exact: true }).click();
  await expect(page.getByTestId('receipt-number')).toHaveText(number);
}

async function confirmReason(page: Page, title: string, reason: string) {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await dialog.getByLabel('Motivo').fill(reason);
  await dialog.getByRole('button', { name: title }).click();
  return dialog;
}

test.describe('Void and cancel (admin)', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('a charge with a payment applied cannot be cancelled @FR-FIN-001.8', async ({ page }) => {
    await openAccount(page, carla);
    await page.getByRole('button', { name: `Acciones para ${matricula}` }).click();
    await page.getByRole('menuitem', { name: 'Cancelar cargo' }).click();
    const dialog = await confirmReason(page, 'Cancelar cargo', 'Beca acordada');
    await expect(page.getByText('El cargo tiene pagos aplicados; anule el pago primero')).toBeVisible();
    await dialog.getByRole('button', { name: 'Volver' }).click();
  });

  test('voids a transfer: the receipt says ANULADO and the charge owes again @FR-FIN-001.16', async ({ page }) => {
    await openReceipt(page, 'R-000001');
    await page.getByRole('button', { name: 'Anular pago' }).click();
    await expect(await confirmReason(page, 'Anular pago', 'Transferencia duplicada')).toBeHidden();

    await expect(page.getByText('ANULADO', { exact: true })).toBeVisible();
    await expect(page.getByTestId('receipt-void')).toContainText('Transferencia duplicada');
    await expect(page.getByTestId('receipt-void')).toContainText('Ada Admin');
    await expect(page.getByTestId('receipt-line')).toContainText(matricula);
    await expect(page.getByRole('button', { name: 'Anular pago' })).toHaveCount(0);

    await openAccount(page, carla);
    await expect(page.getByTestId('charge-row').filter({ hasText: matricula })).toContainText('Vencido');
    await expect(page.getByTestId('overdue-amount')).toContainText(String(data.admin.overdueCharge.amount));
    await expect(page.getByTestId('account-payment-row').filter({ hasText: 'R-000001' })).toContainText('Anulado');
  });

  test('cancels the charge once its payment is voided @FR-FIN-001.8', async ({ page }) => {
    await openAccount(page, carla);
    await page.getByRole('button', { name: `Acciones para ${matricula}` }).click();
    await page.getByRole('menuitem', { name: 'Cancelar cargo' }).click();
    await expect(await confirmReason(page, 'Cancelar cargo', 'Beca acordada')).toBeHidden();

    const row = page.getByTestId('charge-row').filter({ hasText: matricula });
    await expect(row).toContainText('Cancelado');
    await expect(row).toContainText('Beca acordada');
    await expect(page.getByTestId('overdue-amount')).toContainText('0.00');
    await expect(page.getByRole('button', { name: `Acciones para ${matricula}` })).toHaveCount(0);
  });

  test('voiding a payment takes back the saldo a favor it created @FR-FIN-001.16', async ({ page }) => {
    await openReceipt(page, 'R-000002');
    await page.getByRole('button', { name: 'Anular pago' }).click();
    await expect(await confirmReason(page, 'Anular pago', 'Yappy rechazado por el banco')).toBeHidden();
    await expect(page.getByTestId('receipt-void')).toBeVisible();

    await openAccount(page, data.relatedStudents[1]);
    await expect(page.getByTestId('credit-amount')).toContainText('0.00');
    await expect(page.getByTestId('charge-row').filter({ hasText: excursion })).toContainText('Pendiente');
  });

  test('voiding a card payment records the test refund @FR-FIN-001.16', async ({ page }) => {
    await openReceipt(page, 'R-000004');
    await page.getByRole('button', { name: 'Anular pago' }).click();
    await expect(page.getByRole('dialog')).toContainText('reembolso de prueba');
    await expect(await confirmReason(page, 'Anular pago', 'Cobro duplicado')).toBeHidden();
    await expect(page.getByTestId('receipt-void')).toContainText('Reembolso de prueba');
  });
});

test.describe('Void and cancel (guardian)', () => {
  test.use({ storageState: storageStatePath('parent') });

  test("sees the voided payments, can't void or cancel @FR-FIN-001.16 @FR-FIN-001.8", async ({ page, browser }) => {
    await page.goto('/parent/finances');
    await expect(page.getByTestId('parent-credit')).toContainText('0.00');
    await expect(page.getByTestId('parent-payment').filter({ hasText: 'R-000002' })).toContainText('Anulado');
    await expect(page.getByTestId('parent-payment').filter({ hasText: 'R-000004' })).toContainText('Anulado');
    // Only R-000003 (100.00) is still applied to the Mensualidad.
    await expect(page.getByTestId('parent-charge').filter({ hasText: data.charge.description })).toContainText('185.00');

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const [account] = (await (await page.request.get('/api/v1/finance/me/accounts', { headers: { Authorization: `Bearer ${token}` } })).json()) as {
      payments: { id: string; receiptNumber: string }[];
      charges: { id: string; description: string }[];
    }[];
    const paymentId = account.payments.find((p) => p.receiptNumber === 'R-000003')!.id;
    const chargeId = account.charges.find((c) => c.description === excursion)!.id;

    await page.getByTestId('parent-payment').filter({ hasText: 'R-000003' }).getByRole('link').click();
    await expect(page.getByTestId('receipt-number')).toHaveText('R-000003');
    await expect(page.getByRole('button', { name: 'Anular pago' })).toHaveCount(0);

    for (const persona of ['parent', 'teacher'] as const) {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const p = await context.newPage();
      await p.goto('/');
      const headers = { Authorization: `Bearer ${await p.evaluate(() => localStorage.getItem('access_token'))}` };
      expect((await p.request.post(`/api/v1/finance/payments/${paymentId}/void`, { headers, data: { reason: 'x' } })).status()).toBe(403);
      expect((await p.request.post(`/api/v1/finance/charges/${chargeId}/cancel`, { headers, data: { reason: 'x' } })).status()).toBe(403);
      await context.close();
    }

    // A reason is mandatory, even for admins.
    const admin = await browser.newContext({ storageState: storageStatePath('admin') });
    const adminPage = await admin.newPage();
    await adminPage.goto('/');
    const adminHeaders = { Authorization: `Bearer ${await adminPage.evaluate(() => localStorage.getItem('access_token'))}` };
    const blank = await adminPage.request.post(`/api/v1/finance/payments/${paymentId}/void`, { headers: adminHeaders, data: { reason: '  ' } });
    expect(blank.status()).toBe(400);
    await admin.close();
  });
});
