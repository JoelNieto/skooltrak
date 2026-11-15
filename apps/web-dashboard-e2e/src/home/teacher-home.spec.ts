import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * HOM-001-S01 — teacher home "Mi día" and the scoped attendance KPI.
 * docs/product/slices/HOM-001-S01-teacher-my-day.md
 *
 * Fixtures schedule `teacher`'s course in `related` at 00:00 and 23:30 on every weekday, and the other
 * teacher's course in `homeroomOnly` at 00:00. The tests run in order: the first sees the early
 * class without attendance, the second takes it from the home.
 */

const ownClass = `${data.courses.teacherOwn.name} · ${data.classGroups.related}`;

function myDay(page: Page) {
  return page.getByRole('region', { name: 'Mi día' });
}

async function bearerFromPage(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  return { Authorization: `Bearer ${token}` };
}

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Teacher home — Mi día', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: storageStatePath('teacher') });

  test("lists today's classes of the teacher's own courses only @FR-HOM-001.6", async ({ page }) => {
    await page.goto('/home');
    const day = myDay(page);

    await expect(day.getByText(ownClass)).toHaveCount(2);
    await expect(day.getByText(data.courses.otherTeachers.name)).toHaveCount(0);
    await expect(day.getByText(data.classGroups.homeroomOnly)).toHaveCount(0); // homeroom alone is not scope
    await expect(day.getByRole('button', { name: 'Tomar asistencia' })).toHaveCount(1); // the early class
    await expect(page.getByText('Mi día')).toBeVisible();
  });

  test('takes attendance from the home and reflects it on the slot and the KPI @FR-HOM-001.6 @FR-HOM-001.7', async ({
    page,
  }) => {
    await page.goto('/home');
    await myDay(page).getByRole('button', { name: 'Tomar asistencia' }).click();

    const dialog = page.locator('dialog[open]');
    await expect(dialog.locator('#classGroupId option:checked')).toHaveText(data.classGroups.related);
    for (const name of data.relatedStudents) {
      await expect(dialog.getByText(`${name} E2E`)).toBeVisible();
    }
    await dialog.getByRole('button', { name: 'Guardar' }).click();

    const total = data.relatedStudents.length;
    await expect(myDay(page).getByText(`Asistencia tomada · ${total}/${total}`).first()).toBeVisible();
    await expect(myDay(page).getByRole('button', { name: 'Tomar asistencia' })).toHaveCount(0);
    const kpi = page.locator('lib-stat-card', { hasText: 'Asistencia de mis grupos' });
    await expect(kpi).toContainText(/100\s?%/);
  });

  test('API is scoped: teacher record required, school must be in the org @FR-HOM-001.6', async ({ page, request }) => {
    await page.goto('/home');
    const teacher = await bearerFromPage(page);
    const schools = (await (await request.get('/api/v1/schools', { headers: teacher })).json()) as { id: string }[];
    const schoolId = schools[0]?.id;
    expect(schoolId).toBeTruthy();

    const ok = await request.get(`/api/v1/home/teacher/today?schoolId=${schoolId}`, { headers: teacher });
    expect(ok.status()).toBe(200);

    const otherOrg = await request.get('/api/v1/home/teacher/today?schoolId=school-of-another-org', {
      headers: teacher,
    });
    expect(otherOrg.status()).toBe(403);

    // The org admin passes the permission check but has no Teacher record.
    const admin = await bearerFor(request, personas.admin.email);
    const asAdmin = await request.get(`/api/v1/home/teacher/today?schoolId=${schoolId}`, { headers: admin });
    expect(asAdmin.status()).toBe(403);
  });
});
