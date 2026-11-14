import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * COM-002-S04 — teachers can only broadcast to their courses and to class groups related to them.
 * docs/product/slices/COM-002-S04-teacher-audience-scope.md
 */

interface Audiences {
  classGroups: { id: string; name: string }[];
  courses: { id: string; name: string }[];
}

async function openComposer(page: Page) {
  await page.goto('/communication');
  await page.getByRole('tab', { name: 'Mensajes enviados' }).click();
}

/** Bearer header for the persona whose storage state the page was opened with. */
async function bearerFromPage(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  return { Authorization: `Bearer ${token}` };
}

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Teacher broadcast audience @FR-COM-002.1', () => {
  test.use({ storageState: storageStatePath('teacher') });

  test('picker lists only groups related to the teacher’s courses', async ({ page }) => {
    await openComposer(page);

    const groupSelect = page.locator('#class-group');
    await expect(groupSelect.locator('option', { hasText: data.classGroups.related })).toHaveCount(1);
    // Homeroom alone does not count (BR-COM-002.7).
    await expect(groupSelect.locator('option', { hasText: data.classGroups.homeroomOnly })).toHaveCount(0);
  });

  test('sending to a related group succeeds without approval', async ({ page }) => {
    await openComposer(page);

    await page.locator('#class-group').selectOption({ label: data.classGroups.related });
    await page.locator('#title').fill('Reunión de padres');
    await page.locator('#body').fill('El viernes a las 7:00 a. m.');
    await page.getByRole('button', { name: 'Enviar comunicado' }).click();

    await expect(page.getByText('Comunicado enviado', { exact: true })).toBeVisible();
  });

  test('API lists only own targets and refuses the rest with 403', async ({ page, request }) => {
    await page.goto('/communication');
    const teacher = await bearerFromPage(page);

    const own = (await (
      await request.get('/api/v1/communication/broadcasts/audiences', { headers: teacher })
    ).json()) as Audiences;
    expect(own.classGroups.map((g) => g.name)).toEqual([data.classGroups.related]);
    expect(own.courses.map((c) => c.name)).toEqual([data.courses.teacherOwn.name]);

    // The admin's unrestricted view gives us the ids the teacher must not reach.
    const admin = await bearerFor(request, personas.admin.email);
    const all = (await (
      await request.get('/api/v1/communication/broadcasts/audiences', { headers: admin })
    ).json()) as Audiences;
    const homeroomOnlyGroup = all.classGroups.find((g) => g.name === data.classGroups.homeroomOnly);
    const otherTeachersCourse = all.courses.find((c) => c.name === data.courses.otherTeachers.name);
    expect(homeroomOnlyGroup && otherTeachersCourse).toBeTruthy();

    for (const [type, scopeId] of [
      ['CLASS_GROUP', homeroomOnlyGroup?.id],
      ['COURSE', otherTeachersCourse?.id],
    ] as const) {
      const res = await request.post('/api/v1/communication/broadcasts', {
        headers: teacher,
        data: { type, scopeId, title: 'No permitido', body: 'No debería enviarse' },
      });
      expect(res.status(), `${type} broadcast`).toBe(403);
    }
  });
});

test.describe('Admin broadcast audience @FR-COM-002.1', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('picker lists every group of the school', async ({ page }) => {
    await openComposer(page);

    const groupSelect = page.locator('#class-group');
    await expect(groupSelect.locator('option', { hasText: data.classGroups.related })).toHaveCount(1);
    await expect(groupSelect.locator('option', { hasText: data.classGroups.homeroomOnly })).toHaveCount(1);
  });
});
