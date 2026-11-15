import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * HOM-001-S02 — teacher home: Pendientes, period-close banner, this week's assignments, and
 * marking a submission reviewed (BR-HOM-001.17).
 * docs/product/slices/HOM-001-S02-teacher-pending-week.md
 *
 * Fixtures (see `data.period`, `data.grade`, `data.assignment`): one submission to review, one
 * unpublished grade with 2 of 3 scores missing, a period closing in 10 days.
 */

const students = data.relatedStudents.length;

function pending(page: Page) {
  return page.getByRole('region', { name: 'Pendientes' });
}

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Teacher home — Pendientes and week', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: storageStatePath('teacher') });

  test('shows the period banner, pending work and this week’s progress @FR-HOM-001.5 @FR-HOM-001.8 @FR-HOM-001.9', async ({
    page,
  }) => {
    await page.goto('/home');

    await expect(page.getByText(new RegExp(`Cierre del ${data.period.name} en \\d+ días`))).toBeVisible();

    const list = pending(page);
    await expect(list.getByText('Revisar 1 entrega')).toBeVisible();
    await expect(list.getByText('Completar notas en 1 curso')).toBeVisible();
    await expect(list.getByText(`${students - 1} casillas vacías en el periodo`)).toBeVisible();
    await expect(list.getByText('Publicar 1 calificación')).toBeVisible();

    const reviewTile = page.locator('lib-stat-card', { hasText: 'Entregas por revisar' });
    await expect(reviewTile).toContainText('1');

    const week = page.getByRole('region', { name: 'Asignaciones de la semana' });
    const row = week.getByRole('link', { name: new RegExp(data.assignment.title) });
    await expect(row).toContainText('Proyecto');
    await expect(row).toContainText(data.classGroups.related);
    await expect(row.getByRole('progressbar', { name: `1/${students} entregaron` })).toBeVisible();
  });

  test('marking the submission reviewed clears it from the home @FR-HOM-001.7 @FR-HOM-001.8', async ({ page }) => {
    await page.goto('/home');
    await pending(page).getByRole('link', { name: /Revisar 1 entrega/ }).click();

    await expect(page).toHaveURL(/\/assignments\//);
    const assignmentUrl = page.url();
    await page.getByRole('button', { name: 'Marcar revisada' }).click();
    await expect(page.getByRole('button', { name: 'Quitar revisión' })).toBeVisible();
    await expect(page.locator('[uiBadge]', { hasText: 'Revisada' })).toBeVisible();

    await page.goto('/home');
    await expect(pending(page).getByText(/Revisar \d+ entrega/)).toHaveCount(0);
    await expect(page.locator('lib-stat-card', { hasText: 'Entregas por revisar' })).toContainText('Nada por revisar');

    // Clearing the review puts it back.
    await page.goto(assignmentUrl);
    await page.getByRole('button', { name: 'Quitar revisión' }).click();
    await expect(page.getByRole('button', { name: 'Marcar revisada' })).toBeVisible();
    await page.goto('/home');
    await expect(pending(page).getByText('Revisar 1 entrega')).toBeVisible();
  });

  test("another teacher cannot review this course's submissions @FR-HOM-001.8", async ({ page, request }) => {
    await page.goto('/home');
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const teacher = { Authorization: `Bearer ${token}` };
    const schools = (await (await request.get('/api/v1/schools', { headers: teacher })).json()) as { id: string }[];
    const summary = (await (
      await request.get(`/api/v1/home/teacher/summary?schoolId=${schools[0].id}`, { headers: teacher })
    ).json()) as { toReview: { top: { assignmentId: string } | null } };
    const assignmentId = summary.toReview.top?.assignmentId;
    expect(assignmentId).toBeTruthy();

    const submissions = (await (
      await request.get(`/api/v1/assignment-submissions/by-assignment/${assignmentId}`, { headers: teacher })
    ).json()) as { id: string }[];
    expect(submissions).toHaveLength(1);

    const other = await bearerFor(request, personas.otherTeacher.email);
    const res = await request.patch(`/api/v1/assignment-submissions/${submissions[0].id}/review`, {
      headers: other,
      data: { reviewed: true },
    });
    expect(res.status()).toBe(403);
  });
});
