import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S06: the course page for students and parents (FR-ACA-001.10–.13) and who may open it
 * (BR-ACA-001.3). Ana (`student`) is enrolled in `teacher`'s course; her group has the overdue essay
 * `data.studentWork.overdue`. `otherTeacher` neither teaches the course nor is a homeroom teacher of
 * its students. `parent` is linked to Ana and Beto, not Carla. Read-only.
 */

const [, BETO, CARLA] = data.relatedStudents;

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function course(request: APIRequestContext) {
  const teacher = await bearerFor(request, personas.teacher.email);
  const list = (await (
    await request.get('/api/v1/courses', { headers: teacher, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
  ).json()) as { data: { id: string; name: string }[] };
  const id = list.data.find((c) => c.name === data.courses.teacherOwn.name)?.id as string;
  const book = (await (await request.get(`/api/v1/gradebook/${id}`, { headers: teacher })).json()) as {
    rows: { student: { id: string; firstName: string } }[];
  };
  const studentId = (name: string) => book.rows.find((r) => r.student.firstName === name)?.student.id as string;
  return { id, studentId };
}

test.describe('Course page for students @FR-ACA-001.10 @FR-ACA-001.11 @FR-ACA-001.13', () => {
  test.use({ storageState: storageStatePath('student') });

  test('opens on Resumen with the group and schedule, and lists the work with status', async ({ page, request }) => {
    const { id } = await course(request);
    await page.goto(`/courses/${id}`);

    await expect(page.getByText(data.classGroups.related, { exact: true })).toBeVisible();
    await expect(page.getByText(/Todos los días · Aula 7/)).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('region', { name: 'Próximas entregas' })).toContainText(data.studentWork.overdue.title);

    await page.getByRole('tab', { name: /Asignaciones/ }).click();
    const past = page.getByRole('region', { name: 'Pasadas' });
    const essay = past.getByRole('link', { name: new RegExp(data.studentWork.overdue.title) });
    await expect(essay).toContainText('Vencida');
    await expect(page.getByRole('tab', { name: /Asignaciones/ })).toContainText('pendientes');
  });

  test('Calificaciones shows the average, a bar per category and the published grades @FR-ACA-001.14', async ({
    page,
    request,
  }) => {
    const { id } = await course(request);
    await page.goto(`/courses/${id}`);
    // Resumen carries the summary without the table (FR .12).
    const resumen = page.getByRole('region', { name: 'Resumen de calificaciones' });
    await expect(resumen).toContainText('4.0');
    await expect(resumen.getByRole('table')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Calificaciones' }).click();
    const average = page.getByRole('region', { name: 'Promedio del periodo' });
    await expect(average).toContainText('4.0');
    await expect(average).toContainText('Al día');
    await expect(average).toContainText('Nota mínima 3.0');
    await expect(page.getByRole('region', { name: 'Por categoría' })).toContainText(`${data.grade.bucket} · 100 %`);
    const table = page.getByRole('table', { name: 'Calificaciones publicadas' });
    await expect(table.getByRole('row').filter({ hasText: data.publishedGrade.title })).toContainText('4.0');
    // Drafts never reach students (BR-HOM-001.2).
    await expect(table).not.toContainText(data.grade.title);
  });
});

test.describe('Course page for parents @FR-ACA-001.8 @BR-ACA-001.3', () => {
  test.use({ storageState: storageStatePath('parent') });

  test("opens for the chosen child from Mis cursos", async ({ page }) => {
    await page.goto('/courses');
    await page.getByRole('group', { name: 'Elegir hijo' }).getByRole('button', { name: new RegExp(`^${BETO} `) }).click();
    await page.getByRole('list', { name: 'Mis cursos' }).getByRole('link', { name: new RegExp(data.courses.teacherOwn.name) }).click();
    await expect(page.getByRole('tab', { name: 'Resumen' })).toBeVisible();
    await expect(page.getByText(data.classGroups.related, { exact: true })).toBeVisible();
  });
});

test.describe('Course page access @BR-ACA-001.3', () => {
  test('refuses a teacher of other courses and a parent asking for a child not linked', async ({ request }) => {
    const { id, studentId } = await course(request);
    const other = await bearerFor(request, personas.otherTeacher.email);
    const refused = await request.get(`/api/v1/courses/${id}`, { headers: other });
    expect(refused.status()).toBe(403);
    expect(((await refused.json()) as { message: string }).message).toBe('No tienes acceso a este curso');

    const parent = await bearerFor(request, personas.parent.email);
    expect((await request.get(`/api/v1/courses/${id}`, { headers: parent, params: { studentId: studentId(CARLA) } })).status()).toBe(403);
    expect((await request.get(`/api/v1/courses/${id}/work`, { headers: parent, params: { studentId: studentId(BETO) } })).ok()).toBeTruthy();
  });
});
