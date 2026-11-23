import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S04, S14: an admin sets a subject's area, and the student's *Mis cursos* card and the
 * teacher's *Cursos* card show it (FR-ACA-001.2, .7, .9; BR-ACA-001.14). Ana has a single course in the seed, so the filter chips (shown
 * only when there is something to filter) are covered by unit tests.
 * Runs in the `after` project: it changes the subject; afterAll clears the area again.
 */

test.describe.configure({ mode: 'serial' });

const AREA = 'Ciencias exactas E2E';

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Subject area @FR-ACA-001.7 @BR-ACA-001.14', () => {
  let admin: { Authorization: string };
  let subjectId: string;

  test.beforeAll(async ({ request }) => {
    admin = await bearerFor(request, personas.admin.email);
    const courses = (await (
      await request.get('/api/v1/courses', { headers: admin, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
    ).json()) as { data: { name: string; subject: { id: string } }[] };
    subjectId = courses.data.find((c) => c.name === data.courses.teacherOwn.name)?.subject.id as string;
    const res = await request.patch('/api/v1/subjects', { headers: admin, data: { id: subjectId, area: `  ${AREA} ` } });
    expect(res.ok()).toBeTruthy();
    expect(((await res.json()) as { area: string }).area).toBe(AREA);
  });

  test.afterAll(async ({ request }) => {
    if (subjectId) await request.patch('/api/v1/subjects', { headers: admin, data: { id: subjectId, area: '' } });
  });

  test("the student's card shows the subject's area", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('student') });
    const page = await context.newPage();
    await page.goto('/courses');
    const card = page.getByRole('list', { name: 'Mis cursos' }).getByRole('link', { name: new RegExp(data.courses.teacherOwn.name) });
    await expect(card).toContainText(AREA);
    // One area only: nothing to filter, so no chips.
    await expect(page.getByRole('group', { name: 'Filtrar por área' })).toHaveCount(0);
    await context.close();
  });

  test("the teacher's Cursos card shows it too @FR-ACA-001.9", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('teacher') });
    const page = await context.newPage();
    await page.goto('/courses');
    const card = page
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: data.courses.teacherOwn.name, exact: true }) });
    await expect(card).toContainText(AREA);
    await context.close();
  });
});
