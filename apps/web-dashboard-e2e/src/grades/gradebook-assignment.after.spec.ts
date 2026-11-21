import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ASM-001-S06: a grade column linked to one of the course's assignments takes its title and date,
 * and links to it; an assignment links to one column at most, of its own course (BR-ASM-001.11).
 * docs/product/slices/ASM-001-S06-assignment-columns.md
 *
 * Links `data.assignment` ("Proyecto E2E", `teacher`'s course) to a new draft column; afterAll
 * deletes that column. `data.studentWork.otherGroup` belongs to the other teacher's course.
 */

test.describe.configure({ mode: 'serial' });

const PROJECT = data.assignment.title;

type Bearer = { Authorization: string };
type Assignments = { assignments: { id: string; title: string; gradeId: string | null }[] };

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function courseId(request: APIRequestContext, headers: Bearer, name: string) {
  const list = (await (await request.get('/api/v1/courses', { headers, params: { search: name, pageSize: 10 } })).json()) as {
    data: { id: string; name: string }[];
  };
  const course = list.data.find((c) => c.name === name);
  if (!course) throw new Error(`course "${name}" not seeded`);
  return course.id;
}

async function assignmentsOf(request: APIRequestContext, headers: Bearer, id: string) {
  return ((await (await request.get(`/api/v1/gradebook/${id}/assignments`, { headers })).json()) as Assignments).assignments;
}

test.describe('Columns linked to assignments @FR-ASM-001.11 @BR-ASM-001.11', () => {
  test.use({ storageState: storageStatePath('teacher') });
  let teacher: Bearer;
  let id: string;

  test.beforeAll(async ({ request }) => {
    teacher = await bearerFor(request, personas.teacher.email);
    id = await courseId(request, teacher, data.courses.teacherOwn.name);
  });

  test.afterAll(async ({ request }) => {
    const linked = (await assignmentsOf(request, teacher, id)).find((a) => a.title === PROJECT)?.gradeId;
    if (linked) await request.delete(`/api/v1/grades/${linked}`, { headers: teacher });
  });

  test('a new column linked to an assignment takes its title and links to it', async ({ page }) => {
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await page.getByRole('button', { name: 'Nueva calificación' }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Asignación').selectOption({ label: PROJECT });
    await expect(dialog.getByLabel('Titulo')).toHaveValue(PROJECT);
    await dialog.getByLabel('Tipo').selectOption({ label: data.grade.bucket });
    await dialog.getByRole('button', { name: 'Guardar' }).click();

    const header = page.getByRole('columnheader', { name: new RegExp(PROJECT) });
    await expect(header.getByRole('link', { name: `Ver la asignación ${PROJECT}` })).toBeVisible();
  });

  test('an assignment links to one column of its own course', async ({ request }) => {
    const project = (await assignmentsOf(request, teacher, id)).find((a) => a.title === PROJECT);
    expect(project?.gradeId).toBeTruthy();

    const book = (await (await request.get(`/api/v1/gradebook/${id}`, { headers: teacher })).json()) as {
      periodId: string;
      buckets: { id: string }[];
    };
    const column = (assignmentId: string) => ({
      title: 'Columna E2E',
      courseId: id,
      bucketId: book.buckets[0].id,
      periodId: book.periodId,
      date: new Date().toISOString(),
      published: false,
      assignmentId,
    });

    const taken = await request.post('/api/v1/grades', { headers: teacher, data: column(project?.id as string) });
    expect(taken.status()).toBe(409);
    expect(((await taken.json()) as { message: string }).message).toBe('Esta asignación ya tiene una calificación');

    const admin = await bearerFor(request, personas.admin.email);
    const other = await courseId(request, admin, data.courses.otherTeachers.name);
    const foreign = (await assignmentsOf(request, admin, other)).find((a) => a.title === data.studentWork.otherGroup.title);
    expect(foreign).toBeTruthy();
    const mismatch = await request.post('/api/v1/grades', { headers: teacher, data: column(foreign?.id as string) });
    expect(mismatch.status()).toBe(400);
    expect(((await mismatch.json()) as { message: string }).message).toBe('La asignación no pertenece a este curso');
  });
});
