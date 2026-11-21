import { readFile } from 'node:fs/promises';
import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ASM-001-S02: the read-only gradebook grid.
 * docs/product/slices/ASM-001-S02-gradebook-grid.md
 *
 * Seeded in `teacher`'s course (bucket "Pruebas", weight 100, pass mark 3.0), current period:
 * - "Taller E2E", published: Ana 4, Beto 2, Carla 4.5;
 * - "Prueba corta E2E", draft: Ana 4.5.
 * So Beto is "En riesgo" (2.0), Carla "Al día" (4.5); "Taller E2E" averages 3.5 over the group,
 * the draft column 4.5, and the students' averages (4.25, 2, 4.5) 3.6.
 * Read-only: changes nothing other specs rely on.
 */

const [ANA, BETO, CARLA] = data.relatedStudents;

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function courseId(request: APIRequestContext, headers: { Authorization: string }, name: string) {
  const list = (await (
    await request.get('/api/v1/courses', { headers, params: { search: name, pageSize: 10 } })
  ).json()) as { data: { id: string; name: string }[] };
  const course = list.data.find((c) => c.name === name);
  if (!course) throw new Error(`course "${name}" not seeded`);
  return course.id;
}

async function expectSeededGrid(page: Page) {
  const grid = page.getByRole('table', { name: 'Libro de calificaciones' });
  await expect(grid.getByRole('columnheader', { name: 'Pruebas · 100 %' })).toBeVisible();
  await expect(grid.getByRole('columnheader', { name: data.publishedGrade.title })).toBeVisible();
  await expect(grid.getByRole('columnheader', { name: data.grade.title })).toContainText('Borrador');
  await expect(grid.getByRole('columnheader', { name: /Promedio/ })).toContainText('Incluye borradores');

  // One row per student, by first name.
  await expect(grid.locator('tbody').getByRole('rowheader')).toHaveText([
    new RegExp(`${ANA} `),
    new RegExp(`${BETO} `),
    new RegExp(`${CARLA} `),
  ]);

  const row = (name: string) => grid.getByRole('row').filter({ has: page.getByRole('rowheader', { name: new RegExp(`^${name}`) }) });
  await expect(row(BETO)).toContainText('2.0');
  await expect(row(BETO)).toContainText('En riesgo');
  await expect(row(CARLA)).toContainText('Al día');

  const footer = grid.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Promedio del grupo' }) });
  await expect(footer).toContainText('3.5');
  await expect(footer).toContainText('4.5');
  await expect(footer).toContainText('3.6');
}

test.describe('Gradebook grid @FR-ASM-001.2', () => {
  test.use({ storageState: storageStatePath('teacher') });

  test('the course tab shows the period grouped by bucket, with averages and status @BR-ASM-001.5 @BR-ASM-001.6', async ({
    page,
    request,
  }) => {
    const id = await courseId(request, await bearerFor(request, personas.teacher.email), data.courses.teacherOwn.name);
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();

    await expect(page.getByLabel('Periodo')).toHaveValue(/.+/);
    await expect(page.getByLabel('Periodo').locator('option:checked')).toHaveText(data.period.name);
    await expectSeededGrid(page);
  });

  test('the sidebar opens the course graded last, with a course switcher @FR-ASM-001.1', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Libro de calificaciones', exact: true }).first().click();
    await expect(page).toHaveURL(/\/teacher\/gradebook/);

    await expect(page.getByLabel('Curso').locator('option:checked')).toHaveText(data.courses.teacherOwn.name);
    await expectSeededGrid(page);
  });
});

test.describe('Gradebook search and export @FR-ASM-001.12 @FR-ASM-001.13', () => {
  test.use({ storageState: storageStatePath('teacher') });

  test('"Buscar estudiante" filters the rows; the footer stays group-wide', async ({ page, request }) => {
    const id = await courseId(request, await bearerFor(request, personas.teacher.email), data.courses.teacherOwn.name);
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    const grid = page.getByRole('table', { name: 'Libro de calificaciones' });
    await expect(grid.locator('tbody').getByRole('rowheader')).toHaveCount(3);

    await page.getByRole('searchbox', { name: 'Buscar estudiante por nombre o cédula' }).fill('carl');
    await expect(grid.locator('tbody').getByRole('rowheader')).toHaveText([new RegExp(`${CARLA} `)]);
    await expect(grid.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Promedio del grupo' }) })).toContainText('3.6');

    await page.getByRole('searchbox', { name: 'Buscar estudiante por nombre o cédula' }).fill('zzz');
    await expect(grid.getByText('Ningún estudiante coincide con «zzz»')).toBeVisible();
  });

  test('"Exportar CSV" downloads the saved view', async ({ page, request }) => {
    const id = await courseId(request, await bearerFor(request, personas.teacher.email), data.courses.teacherOwn.name);
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await expect(page.getByRole('columnheader', { name: data.publishedGrade.title })).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^calificaciones-.+\.csv$/);
    const csv = await readFile(await file.path(), 'utf8');
    const lines = csv.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines[0]).toBe(`Estudiante,Cédula,${data.publishedGrade.title},${data.grade.title},Promedio,Estado`);
    expect(lines.find((l) => l.startsWith(`${BETO} `))).toMatch(/,2\.0,,2\.0,En riesgo$/);
  });
});

test.describe('Gradebook access @BR-ASM-001.1', () => {
  test("a teacher cannot open another teacher's gradebook; an admin can", async ({ request }) => {
    const admin = await bearerFor(request, personas.admin.email);
    const otherCourse = await courseId(request, admin, data.courses.otherTeachers.name);

    const teacher = await bearerFor(request, personas.teacher.email);
    const refused = await request.get(`/api/v1/gradebook/${otherCourse}`, { headers: teacher });
    expect(refused.status()).toBe(403);
    expect(((await refused.json()) as { message: string }).message).toBe('Solo puedes calificar tus propios cursos');

    const asAdmin = await request.get(`/api/v1/gradebook/${otherCourse}`, { headers: admin });
    expect(asAdmin.ok()).toBeTruthy();
    expect((await request.get(`/api/v1/gradebook/${otherCourse}/export`, { headers: teacher })).status()).toBe(403);
  });

  test('a student cannot open a gradebook', async ({ request }) => {
    const teacher = await bearerFor(request, personas.teacher.email);
    const own = await courseId(request, teacher, data.courses.teacherOwn.name);
    const student = await bearerFor(request, personas.student.email);
    const res = await request.get(`/api/v1/gradebook/${own}`, { headers: student });
    expect(res.status()).toBe(403);
  });
});
