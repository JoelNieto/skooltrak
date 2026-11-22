import { APIRequestContext, Browser, expect, Locator, test } from '@playwright/test';
import { BookOpen, Sigma } from 'lucide';
import { resolveCourseColor } from '#/shared';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S01: an admin picks a color for a course and an icon for its subject, and everyone sees
 * them on the course cover (FR-ACA-001.1, .2; BR-ACA-001.11). Uses `teacher`'s course (subject
 * "Matemáticas"), which `student` takes. The other teacher's course ("Ciencias") stays unset and
 * shows the derived default. Both values are cleared again after the suite.
 */

const COURSE = data.courses.teacherOwn.name;
const SUBJECT = 'Matemáticas';
const OTHER_SUBJECT = 'Ciencias';

const firstPath = (icon: readonly (readonly [string, Record<string, unknown>])[]) =>
  icon.find(([tag]) => tag === 'path')?.[1]['d'] as string;

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function ids(request: APIRequestContext) {
  const admin = await bearerFor(request, personas.admin.email);
  const courses = (await (
    await request.get('/api/v1/courses', { headers: admin, params: { search: COURSE, pageSize: 10 } })
  ).json()) as { data: { id: string; name: string }[] };
  const subjects = (await (
    await request.get('/api/v1/subjects', { headers: admin, params: { search: SUBJECT, pageSize: 10 } })
  ).json()) as { data: { id: string; name: string }[] };
  const courseId = courses.data.find((c) => c.name === COURSE)?.id;
  const subjectId = subjects.data.find((s) => s.name === SUBJECT)?.id;
  expect(courseId && subjectId).toBeTruthy();
  return { admin, courseId: courseId as string, subjectId: subjectId as string };
}

async function pageAs(browser: Browser, persona: 'admin' | 'student') {
  const context = await browser.newContext({ storageState: storageStatePath(persona) });
  return context.newPage();
}

/** The cover of the course card whose title is `subjectName` (staff) or the course's name (students). */
const coverOf = (page: import('@playwright/test').Page, subjectName: string): Locator =>
  page.getByRole('link').filter({ has: page.getByRole('heading', { name: subjectName, exact: true }) }).locator('ui-course-cover');

/** Clicks Guardar in the open dialog and returns the status of the PATCH it sends. */
async function save(page: import('@playwright/test').Page, path: string) {
  const response = page.waitForResponse(
    (r) => r.url().endsWith(path) && r.request().method() === 'PATCH',
    { timeout: 15_000 },
  );
  await page.locator('dialog[open]').getByRole('button', { name: 'Guardar' }).click();
  return (await response).status();
}

const coverIconPath = (cover: Locator) =>
  cover.locator('.ui-course-cover__icon path').first().getAttribute('d');

test.describe('Course color and subject icon @FR-ACA-001.1 @FR-ACA-001.2', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async ({ request }) => {
    const { admin, courseId, subjectId } = await ids(request);
    await request.patch('/api/v1/courses', { headers: admin, data: { id: courseId, color: null } });
    await request.patch('/api/v1/subjects', { headers: admin, data: { id: subjectId, icon: null } });
  });

  test('without setup, a course shows a color derived from its id and the book-open icon', async ({ browser }) => {
    const page = await pageAs(browser, 'admin');
    await page.goto('/courses');
    const cover = coverOf(page, OTHER_SUBJECT);
    await expect(cover).toBeVisible();

    const href = await page
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: OTHER_SUBJECT, exact: true }) })
      .getAttribute('href');
    const courseId = href?.split('/').pop() ?? '';
    await expect(cover).toHaveAttribute('data-color', resolveCourseColor(courseId, null));
    expect(await coverIconPath(cover)).toBe(firstPath(BookOpen));

    await page.reload();
    await expect(coverOf(page, OTHER_SUBJECT)).toHaveAttribute('data-color', resolveCourseColor(courseId, null));
  });

  test('an admin sets the course color and the subject icon in the forms', async ({ browser }) => {
    const page = await pageAs(browser, 'admin');

    await page.goto('/admin/courses');
    await page.getByRole('button', { name: `Acciones para ${COURSE}` }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    const courseDialog = page.locator('dialog[open]');
    // Wait until the form shows the course, as a user would, before changing it.
    await expect(courseDialog.getByRole('combobox', { name: 'Asignatura' })).toHaveValue(SUBJECT);
    await expect(courseDialog.locator('#studyPlanId option:checked')).toHaveText(data.studyPlans.seventh);
    await courseDialog.getByTitle('Rosa').click();
    await expect(courseDialog.getByRole('radio', { name: 'Rosa' })).toBeChecked();
    expect(await save(page, '/api/v1/courses')).toBe(200);
    await expect(page.locator('dialog[open]')).toHaveCount(0);

    await page.goto('/admin/subjects');
    await page.getByRole('button', { name: `Acciones para ${SUBJECT}` }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    const subjectDialog = page.locator('dialog[open]');
    await expect(subjectDialog.locator('#name')).toHaveValue(SUBJECT);
    await subjectDialog.getByTitle('Sigma').click();
    await expect(subjectDialog.getByRole('radio', { name: 'Sigma' })).toBeChecked();
    expect(await save(page, '/api/v1/subjects')).toBe(200);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('the student sees them on Cursos and in the course header', async ({ browser }) => {
    const page = await pageAs(browser, 'student');
    await page.goto('/courses');
    // Students' Mis cursos cards (ACA-001-S02) are titled with the course's name.
    const cover = coverOf(page, data.courses.teacherOwn.name);
    await expect(cover).toHaveAttribute('data-color', 'ROSE');
    expect(await coverIconPath(cover)).toBe(firstPath(Sigma));

    await page
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: data.courses.teacherOwn.name, exact: true }) })
      .click();
    const header = page.locator('ui-course-cover[data-color="ROSE"]');
    await expect(header).toBeVisible();
    await expect(page.locator('.course-color-dot')).toHaveCSS('background-color', 'rgb(190, 24, 93)');
  });

  test('the API refuses other color and icon values', async ({ request }) => {
    const { admin, courseId, subjectId } = await ids(request);
    const color = await request.patch('/api/v1/courses', { headers: admin, data: { id: courseId, color: 'PURPLE' } });
    expect(color.status()).toBe(400);
    const icon = await request.patch('/api/v1/subjects', {
      headers: admin,
      data: { id: subjectId, icon: 'not-an-icon' },
    });
    expect(icon.status()).toBe(400);
  });
});
