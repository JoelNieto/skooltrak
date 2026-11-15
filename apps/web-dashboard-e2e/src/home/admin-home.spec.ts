import { expect, test } from '@playwright/test';
import { data, personas, storageStatePath } from '../support/fixtures';

/**
 * HOM-001-S08 — school admin home: attention tiles, period-close banner and KPI row, behind
 * VIEW_SCHOOL_DASHBOARD (BR-HOM-001.10, .14, .15, .16).
 * docs/product/slices/HOM-001-S08-admin-attention.md
 *
 * Fixtures: see `data.admin`, `data.period` (closes in 10 days) and the 8° plan without a metric.
 * Attendance today and this month's collection depend on run order and date, so only their tiles
 * are checked, not their values.
 */

function tile(page: import('@playwright/test').Page, label: string) {
  return page.getByRole('region', { name: 'Requiere tu atención' }).getByRole('link').filter({ hasText: label });
}

test.describe('Admin home', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('shows what needs the admin, each linking to where it is resolved @FR-HOM-001.24', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: new RegExp(`, ${personas.admin.firstName}$`) })).toBeVisible();

    await expect(tile(page, 'Solicitudes de ingreso')).toContainText('1 docente');
    await expect(tile(page, 'Solicitudes de ingreso')).toHaveAttribute('href', '/admin/join-requests');
    await expect(tile(page, 'Comunicados por aprobar')).toHaveAttribute('href', '/communication');
    await expect(tile(page, 'Clases sin asistencia hoy')).toHaveAttribute('href', '/admin/attendance-reporting');
    await expect(tile(page, 'Cargos vencidos')).toContainText('1 familia');
    await expect(tile(page, 'Cargos vencidos')).toContainText(String(data.admin.overdueCharge.amount));
    await expect(tile(page, 'Importación con errores')).toHaveAttribute('href', '/admin/imports');
    await expect(tile(page, 'Planes sin escala de notas')).toContainText('1');
  });

  test('shows the period banner and the KPI row @FR-HOM-001.5 @FR-HOM-001.25', async ({ page }) => {
    await page.goto('/home');

    await expect(page.getByText(new RegExp(`Cierre del ${data.period.name} en \\d+ días`))).toBeVisible();
    await expect(page.getByText(/\d+ de \d+ cursos tienen calificaciones incompletas/)).toBeVisible();

    await expect(page.locator('lib-stat-card', { hasText: 'Estudiantes activos' })).toContainText(
      String(data.relatedStudents.length),
    );
    await expect(page.locator('lib-stat-card', { hasText: 'Asistencia hoy' })).toBeVisible();
    await expect(page.locator('lib-stat-card', { hasText: 'Cobranza del mes' })).toBeVisible();
    // Published scores 4.0, 2.0, 4.5 on a 3.0 pass mark: one below, one excellent (4.5+).
    const passing = page.locator('lib-stat-card', { hasText: 'Aprobando todas las materias' });
    await expect(passing).toContainText('1 bajo la nota mínima');
    await expect(passing).toContainText('1 en excelencia');
  });

  test('admin endpoints need VIEW_SCHOOL_DASHBOARD and a school of the org @FR-HOM-001.24', async ({ page, request, browser }) => {
    await page.goto('/home');
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const headers = { Authorization: `Bearer ${token}` };
    const schools = (await (await request.get('/api/v1/schools', { headers })).json()) as { id: string }[];
    expect((await request.get(`/api/v1/home/admin/kpis?schoolId=${schools[0].id}`, { headers })).status()).toBe(200);
    expect((await request.get('/api/v1/home/admin/attention?schoolId=school-of-another-org', { headers })).status()).toBe(403);

    const ctx = await browser.newContext({ storageState: storageStatePath('teacher') });
    const p = await ctx.newPage();
    await p.goto('/login');
    const teacher = await p.evaluate(() => localStorage.getItem('access_token'));
    await ctx.close();
    const asTeacher = await request.get(`/api/v1/home/admin/attention?schoolId=${schools[0].id}`, {
      headers: { Authorization: `Bearer ${teacher}` },
    });
    expect(asTeacher.status()).toBe(403);
  });
});
