import { expect, test } from '@playwright/test';
import { data, personas, storageStatePath } from '../support/fixtures';

/**
 * HOM-001-S06 — parent home: switcher with alert counts, alerts and KPIs of the selected child,
 * and the link check (BR-HOM-001.9).
 * docs/product/slices/HOM-001-S06-parent-children.md
 *
 * `parent` is linked to Ana (charge due in 3 days + overdue work) and Beto (overdue work + average
 * below the pass mark). Both have 2 alerts, so Ana is selected (alphabetical tie-break).
 */

const ana = `${data.relatedStudents[0]} E2E`;
const beto = `${data.relatedStudents[1]} E2E`;

test.describe('Parent home', () => {
  test.use({ storageState: storageStatePath('parent') });

  test('shows one button per child with alert counts and selects the default @FR-HOM-001.18', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: `Hola, ${personas.parent.firstName}` })).toBeVisible();

    const switcher = page.getByRole('group', { name: 'Elegir hijo' });
    const anaButton = switcher.getByRole('button', { name: new RegExp(ana) });
    const betoButton = switcher.getByRole('button', { name: new RegExp(beto) });
    await expect(anaButton).toContainText('2 alertas');
    await expect(betoButton).toContainText('2 alertas');
    await expect(anaButton).toHaveAttribute('aria-pressed', 'true');
    await expect(betoButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('shows alerts and KPIs of the selected child, and switches @FR-HOM-001.19 @FR-HOM-001.20', async ({ page }) => {
    await page.goto('/home');

    let alerts = page.getByRole('region', { name: `Requiere tu atención · ${data.relatedStudents[0]}` });
    await expect(alerts.getByText('Tarea vencida')).toBeVisible();
    await expect(alerts.getByText(data.studentWork.overdue.title, { exact: false })).toBeVisible();
    await expect(alerts.getByText('Pago próximo a vencer')).toBeVisible();
    await expect(alerts.getByText(data.charge.description, { exact: false })).toBeVisible();
    await expect(alerts.getByRole('link', { name: 'Ver estado de cuenta' })).toBeVisible();

    await expect(page.locator('lib-stat-card', { hasText: 'Promedio del periodo' })).toContainText('4.0 / 5.0');
    const pending = page.locator('lib-stat-card', { hasText: 'Entregas pendientes' });
    await expect(pending).toContainText('2');
    await expect(pending).toContainText('1 vencida');
    await expect(page.locator('lib-stat-card', { hasText: 'Saldo' })).toContainText('285');

    await page.getByRole('group', { name: 'Elegir hijo' }).getByRole('button', { name: new RegExp(beto) }).click();
    alerts = page.getByRole('region', { name: `Requiere tu atención · ${data.relatedStudents[1]}` });
    await expect(alerts.getByText(`Nota baja en ${data.courses.teacherOwn.name}`)).toBeVisible();
    await expect(alerts.getByText(`mínimo para aprobar ${data.metric.minimumApproval.toFixed(1)}`, { exact: false })).toBeVisible();
    await expect(alerts.getByText('2 tareas vencidas')).toBeVisible();
    await expect(alerts.getByText('Pago próximo a vencer')).toHaveCount(0);
  });

  test('refuses a student who is not linked, and non-parents @FR-HOM-001.18', async ({ page, request, browser }) => {
    await page.goto('/home');
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const headers = { Authorization: `Bearer ${token}` };
    const { children } = (await (await request.get('/api/v1/home/parent/children', { headers })).json()) as {
      children: { studentId: string }[];
    };
    expect(children).toHaveLength(2);

    // The third related student is not linked to this parent: find their id as the teacher.
    const teacherContext = await browser.newContext({ storageState: storageStatePath('teacher') });
    const teacherPage = await teacherContext.newPage();
    await teacherPage.goto('/login');
    const teacherToken = await teacherPage.evaluate(() => localStorage.getItem('access_token'));
    await teacherContext.close();
    const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };
    // The teacher's class roster lists the third student (the students directory hides students without a login).
    const schools = (await (await request.get('/api/v1/schools', { headers: teacherHeaders })).json()) as { id: string }[];
    const today = (await (
      await request.get(`/api/v1/home/teacher/today?schoolId=${schools[0].id}`, { headers: teacherHeaders })
    ).json()) as { slots: { course: { id: string }; classGroup: { id: string } }[] };
    const slot = today.slots[0];
    const roster = (await (
      await request.get(`/api/v1/attendance/students?courseId=${slot.course.id}&classGroupId=${slot.classGroup.id}`, {
        headers: teacherHeaders,
      })
    ).json()) as { id: string; firstName: string }[];
    const unlinked = roster.find((s) => s.firstName === data.relatedStudents[2]);
    expect(unlinked).toBeTruthy();

    const res = await request.get(`/api/v1/home/parent/child/${unlinked?.id}`, { headers });
    expect(res.status()).toBe(403);

    const asTeacher = await request.get('/api/v1/home/parent/children', { headers: teacherHeaders });
    expect(asTeacher.status()).toBe(403);
  });
});
