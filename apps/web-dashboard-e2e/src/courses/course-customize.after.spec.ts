import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S09: a course's teacher (CUSTOMIZE_COURSES) or an admin sets its color and cover photo
 * (FR-ACA-001.3, BR .12). Runs in the `after` project: it changes `teacher`'s course color, and puts
 * the original back afterwards. A successful cover upload is not exercised here (it would write to
 * the real object store); unit tests cover it, and this spec checks the refusals.
 */

test.describe.configure({ mode: 'serial' });

type Bearer = { Authorization: string };

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Course customization @FR-ACA-001.3 @BR-ACA-001.12', () => {
  let teacher: Bearer;
  let courseId: string;
  let originalColor: string | null;

  test.beforeAll(async ({ request }) => {
    teacher = await bearerFor(request, personas.teacher.email);
    const list = (await (
      await request.get('/api/v1/courses', { headers: teacher, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
    ).json()) as { data: { id: string; name: string }[] };
    courseId = list.data.find((c) => c.name === data.courses.teacherOwn.name)?.id as string;
    const course = (await (await request.get(`/api/v1/courses/${courseId}`, { headers: teacher })).json()) as {
      color: string;
      colorIsDefault: boolean;
    };
    originalColor = course.colorIsDefault ? null : course.color;
  });

  test.afterAll(async ({ request }) => {
    await request.patch(`/api/v1/courses/${courseId}/appearance`, { headers: teacher, data: { color: originalColor, icon: null } });
  });

  test('the course teacher picks a color from "Personalizar"', async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('teacher') });
    const page = await context.newPage();
    await page.goto(`/courses/${courseId}`);
    await page.getByRole('button', { name: 'Personalizar' }).click();
    const dialog = page.getByRole('dialog');
    // The radio is visually hidden behind its swatch; people click the swatch.
    const saved = page.waitForResponse((r) => r.url().endsWith(`/courses/${courseId}/appearance`));
    await dialog.getByTitle('Verde', { exact: true }).click();
    const res = await saved;
    expect(res.status(), await res.text()).toBe(200);
    await expect(dialog.getByRole('radio', { name: 'Verde', exact: true })).toBeChecked();
    await dialog.getByRole('button', { name: 'Listo' }).click();
    await expect(page.locator('ui-course-cover[data-color="GREEN"]').first()).toBeVisible();
    await context.close();
  });

  test('the course teacher picks an icon instead of a photo', async ({ browser, request }) => {
    const context = await browser.newContext({ storageState: storageStatePath('teacher') });
    const page = await context.newPage();
    await page.goto(`/courses/${courseId}`);
    await page.getByRole('button', { name: 'Personalizar' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: /Ícono/ }).click();
    const saved = page.waitForResponse((r) => r.url().endsWith(`/courses/${courseId}/appearance`));
    await dialog.getByRole('radio', { name: 'Átomo' }).click();
    const res = await saved;
    expect(res.status(), await res.text()).toBe(200);
    await expect(dialog.getByRole('radio', { name: 'Átomo' })).toHaveAttribute('aria-checked', 'true');
    await context.close();

    const course = (await (await request.get(`/api/v1/courses/${courseId}`, { headers: teacher })).json()) as { icon: string | null };
    expect(course.icon).toBe('atom');
    const bad = await request.patch(`/api/v1/courses/${courseId}/appearance`, { headers: teacher, data: { icon: 'skull' } });
    expect(bad.status()).toBe(400);
  });

  test('refuses other teachers, students, and covers that are not images', async ({ request }) => {
    const other = await bearerFor(request, personas.otherTeacher.email);
    const refused = await request.patch(`/api/v1/courses/${courseId}/appearance`, { headers: other, data: { color: 'TEAL' } });
    expect(refused.status()).toBe(403);

    const student = await bearerFor(request, personas.student.email);
    expect((await request.patch(`/api/v1/courses/${courseId}/appearance`, { headers: student, data: { color: 'TEAL' } })).status()).toBe(403);

    const notImage = await request.post(`/api/v1/courses/${courseId}/cover`, {
      headers: teacher,
      multipart: { file: { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') } },
    });
    expect(notImage.status()).toBe(400);
    expect(((await notImage.json()) as { message: string }).message).toBe('La portada debe ser una imagen JPEG, PNG o WebP de hasta 2 MB');
  });
});
