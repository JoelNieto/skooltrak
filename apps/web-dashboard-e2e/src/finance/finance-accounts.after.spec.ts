import { expect, test } from '@playwright/test';
import { data, storageStatePath } from '../support/fixtures';

/**
 * FIN-001-S01 — family accounts, a manual charge, and the guardian's Estado de cuenta.
 * docs/product/slices/FIN-001-S01-ledger-foundation.md
 *
 * Fixtures: `data.finance`. Runs after the other specs (`.after`) because it adds a charge to the
 * family account that the parent home spec reads.
 */

// The parent's Estado de cuenta expects the manual charge the admin adds, so the file runs in order.
test.describe.configure({ mode: 'serial' });

const [ana, beto, carla] = data.relatedStudents;

/**
 * Days the seeded charge is overdue, as the API counts them: the seed sets the due date in UTC
 * (`inDays` from the seed), the API counts from the school's today (America/Panama). Between 00:00
 * and 05:00 UTC the two dates differ by one.
 */
function overdueDays(inDays: number) {
  const due = new Date(Date.now() + inDays * 86_400_000).toISOString().slice(0, 10);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Panama' }).format(new Date());
  return Math.round((Date.parse(today) - Date.parse(due)) / 86_400_000);
}

function isoDay(offsetDays: number) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

test.describe('Finance accounts (admin)', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('puts siblings with the same guardian in one account and finds it by name @FR-FIN-001.1 @FR-FIN-001.2', async ({
    page,
  }) => {
    await page.goto('/financial-module');
    await expect(page).toHaveURL(/\/financial-module\/accounts$/);
    await expect(page.getByRole('heading', { name: 'Finanzas' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Buscar cuenta' }).fill(beto);
    const rows = page.getByTestId('account-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(data.finance.familyName);
    await expect(rows.first()).toContainText('C-0001');
    await expect(rows.first()).toContainText(ana);
    await expect(rows.first()).toContainText(beto);
    await expect(rows.first()).not.toContainText(carla);
    await expect(rows.first()).toContainText(String(data.charge.amount));
  });

  test('filters to accounts with an overdue balance @FR-FIN-001.2', async ({ page }) => {
    await page.goto('/financial-module/accounts?overdue=true');
    const rows = page.getByTestId('account-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(carla);
    await expect(rows.first()).toContainText(`${overdueDays(data.admin.overdueCharge.inDays)} días`);
  });

  test('adds a manual charge to one student of the account @FR-FIN-001.7 @FR-FIN-001.3', async ({ page }) => {
    await page.goto('/financial-module/accounts');
    await page.getByRole('searchbox', { name: 'Buscar cuenta' }).fill(beto);
    const rows = page.getByTestId('account-row');
    await expect(rows).toHaveCount(1);
    await rows.getByRole('link', { name: data.finance.familyName }).click();
    await expect(page.getByTestId('account-header')).toContainText('C-0001');
    const due = page.getByTestId('due-amount');
    await expect(due).toContainText('285.00');

    await page.getByRole('button', { name: 'Nuevo cargo' }).last().click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Nuevo cargo' });
    await dialog.getByLabel('Estudiante').selectOption({ label: `${beto} E2E` });
    await dialog.getByLabel('Concepto').fill(data.finance.manualCharge.description);
    await dialog.getByLabel('Monto').fill(String(data.finance.manualCharge.amount));
    await dialog.getByLabel('Vence').fill(isoDay(data.finance.manualCharge.inDays));
    await dialog.getByRole('button', { name: 'Crear cargo' }).click();
    await expect(dialog).toBeHidden();

    const row = page.getByTestId('charge-row').filter({ hasText: data.finance.manualCharge.description });
    await expect(row).toContainText('Pendiente');
    await expect(row).toContainText('25.00');
    await expect(due).toContainText('310.00');
  });
});

test.describe('Estado de cuenta (parent)', () => {
  test.use({ storageState: storageStatePath('parent') });

  test("shows the family account with each child's charges @FR-FIN-001.12", async ({ page }) => {
    await page.goto('/parent/finances');
    await expect(page.getByTestId('parent-account-summary')).toContainText('C-0001');
    await expect(page.getByTestId('parent-due')).toContainText('310.00');

    const anaGroup = page.locator('section', { has: page.getByRole('heading', { name: new RegExp(`^${ana} E2E`) }) });
    await expect(anaGroup.getByTestId('parent-charge')).toContainText(data.charge.description);
    const betoGroup = page.locator('section', { has: page.getByRole('heading', { name: new RegExp(`^${beto} E2E`) }) });
    await expect(betoGroup.getByTestId('parent-charge')).toContainText(data.finance.manualCharge.description);
    await expect(page.getByText(data.admin.overdueCharge.description)).toHaveCount(0); // Carla's account
  });

  test("cannot open another family's account or the school's account list @FR-FIN-001.12 @FR-FIN-001.2", async ({
    page,
    request,
    browser,
  }) => {
    // Carla's account id, read as the admin.
    const admin = await browser.newContext({ storageState: storageStatePath('admin') });
    const adminPage = await admin.newPage();
    await adminPage.goto('/financial-module/accounts?overdue=true');
    const href = await adminPage.getByTestId('account-row').getByRole('link').first().getAttribute('href');
    await admin.close();
    const accountId = href?.split('/').pop();
    expect(accountId).toBeTruthy();

    await page.goto('/parent/finances');
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const headers = { Authorization: `Bearer ${token}` };
    const own = await request.get('/api/v1/finance/me/accounts', { headers });
    expect(own.ok()).toBe(true);
    expect((await own.json()).map((a: { id: string }) => a.id)).not.toContain(accountId);

    const other = await request.get(`/api/v1/finance/accounts/${accountId}`, { headers });
    expect(other.status()).toBe(403);

    // Guardians are never finance staff, whatever the school (BR: parents see only their accounts).
    const list = await request.get('/api/v1/finance/accounts?schoolId=any', { headers });
    expect(list.status()).toBe(403);
  });
});
