import { expect, test } from '@playwright/test';
import { data, storageStatePath } from '../support/fixtures';

/**
 * FIN-001-S02 — fee catalog, assignments to a degree and a study plan, and charge generation.
 * docs/product/slices/FIN-001-S02-fee-catalog-generation.md
 *
 * Works on next school year, so every generated charge is due in the future, and generates for
 * Carla only (her own account), so the balances FIN-001-S01 asserts for "Familia E2E" don't move.
 * Runs after the other specs (`.after`) because it adds charges.
 */

test.describe.configure({ mode: 'serial' });

const { fee } = data.finance;
const carla = data.relatedStudents[2];
const nextYear = new Date().getFullYear() + 1;

test.describe('Fee catalog and generation (admin)', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('creates a monthly fee item @FR-FIN-001.4', async ({ page }) => {
    await page.goto('/financial-module/catalog');
    await expect(page.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('button', { name: 'Nuevo concepto' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Nuevo concepto' });
    await dialog.getByLabel('Nombre').fill(fee.name);
    await dialog.getByLabel('Tipo').selectOption({ label: 'Otro' });
    await dialog.getByLabel('Monto').fill(String(fee.amount));
    await dialog.getByLabel('Frecuencia').selectOption({ label: 'Mensual' });
    await dialog.getByLabel('Desde').selectOption({ label: 'Marzo' });
    await dialog.getByLabel('Hasta').selectOption({ label: 'Mayo' });
    await dialog.getByLabel('Día de vencimiento').fill(String(fee.dueDay));
    await dialog.getByRole('button', { name: 'Crear concepto' }).click();
    await expect(dialog).toBeHidden();

    const row = page.getByTestId('fee-item-row').filter({ hasText: fee.name });
    await expect(row).toContainText('Mensual · mar–may · día 5');
    await expect(row).toContainText('30.00');
  });

  test('assigns it to the degree and overrides the amount for one study plan @FR-FIN-001.5', async ({ page }) => {
    await page.goto('/financial-module/catalog');
    await page.getByLabel('Año escolar').selectOption(String(nextYear));

    const assign = async (target: string, amount?: number) => {
      await page.getByRole('button', { name: 'Asignar', exact: true }).click();
      const dialog = page.getByRole('dialog').filter({ hasText: 'Asignar concepto' });
      await dialog.getByLabel('Concepto').selectOption({ label: fee.name });
      await dialog.getByLabel('Aplica a').selectOption({ label: target });
      if (amount) await dialog.getByLabel('Monto').fill(String(amount));
      await dialog.getByRole('button', { name: 'Asignar' }).click();
      return dialog;
    };

    await expect(await assign(`Todo el nivel ${data.finance.degree}`)).toBeHidden();
    await expect(await assign(data.studyPlans.seventh, fee.planAmount)).toBeHidden();

    const rows = page.getByTestId('fee-assignment-row').filter({ hasText: fee.name });
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: `Nivel ${data.finance.degree}` })).toContainText('30.00');
    await expect(rows.filter({ hasText: data.studyPlans.seventh })).toContainText('20.00');

    // One assignment per item, target and year (BR-FIN-001.4).
    const again = await assign(data.studyPlans.seventh);
    await expect(page.getByText('Ya está asignado')).toBeVisible();
    await again.getByRole('button', { name: 'Cancelar' }).click();
    await expect(rows).toHaveCount(2);
  });

  test("previews and generates a student's charges, once @FR-FIN-001.6", async ({ page }) => {
    await page.goto('/financial-module/catalog');
    await page.getByLabel('Año escolar').selectOption(String(nextYear));
    await page.getByRole('link', { name: 'Generar cargos' }).click();
    await expect(page).toHaveURL(new RegExp(`/financial-module/charges/generate\\?year=${nextYear}`));

    await page.getByRole('button', { name: 'Un estudiante' }).click();
    await page.getByPlaceholder('Buscar alumno por nombre o documento...').fill(carla);
    await page.getByRole('button', { name: new RegExp(`^${carla} E2E`) }).click();
    await page.getByRole('button', { name: 'Vista previa' }).click();

    const preview = page.getByTestId('generation-preview');
    await expect(preview.getByTestId('preview-item')).toContainText(fee.name);
    await expect(preview.getByTestId('preview-new')).toHaveText('3 cargos nuevos');
    // The 7° plan's amount replaces the degree's for the same item.
    await expect(preview.getByTestId('preview-total')).toContainText('60.00');

    await preview.getByRole('button', { name: 'Generar 3 cargos' }).click();
    await expect(page.getByText('3 cargos creados')).toBeVisible();

    // Running it again creates nothing (BR-FIN-001.5).
    await expect(preview.getByTestId('preview-new')).toHaveText('0 cargos nuevos');
    await expect(preview.getByTestId('preview-existing')).toHaveText('3 ya generados');
    await expect(preview.getByRole('button', { name: /^Generar/ })).toBeDisabled();

    await page.goto('/financial-module/accounts');
    await page.getByRole('searchbox', { name: 'Buscar cuenta' }).fill(carla);
    await page.getByTestId('account-row').getByRole('link').first().click();
    const charge = page.getByTestId('charge-row').filter({ hasText: `${fee.name} — marzo ${nextYear}` });
    await expect(charge).toContainText('Pendiente');
    await expect(charge).toContainText('20.00');
  });
});

test.describe('Fee catalog access', () => {
  for (const persona of ['parent', 'teacher'] as const) {
    test(`a ${persona} cannot use the fee catalog API @FR-FIN-001.4`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const page = await context.newPage();
      await page.goto('/');
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      const headers = { Authorization: `Bearer ${token}` };

      const list = await page.request.get('/api/v1/finance/fee-items?schoolId=any', { headers });
      expect(list.status()).toBe(403);
      const create = await page.request.post('/api/v1/finance/charges/generate', {
        headers,
        data: { schoolId: 'any', year: nextYear, studentId: 'any' },
      });
      expect(create.status()).toBe(403);
      await context.close();
    });
  }
});
