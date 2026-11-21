import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ASM-001-S03: typing scores into the gradebook, saving drafts, conflicts.
 * docs/product/slices/ASM-001-S03-inline-entry.md
 *
 * Seeded in `teacher`'s course (bucket "Pruebas", scale 1–5, pass mark 3.0):
 * - "Taller E2E", published: Ana 4, Beto 2, Carla 4.5;
 * - "Prueba corta E2E", draft: Ana 4.5, Beto and Carla empty.
 * Saving Beto's draft cell to 3 makes his "Pruebas" mean (2 + 3) / 2 = 2.5, "En riesgo".
 *
 * Runs in the `after` project: it changes a draft score that the HOM-001 specs count as empty.
 * Beto's and Carla's cells are emptied again in afterAll.
 */

// Every test here writes Beto's draft cell: one at a time, or they conflict with each other (BR .7).
test.describe.configure({ mode: 'serial' });

const [ANA, BETO, CARLA] = data.relatedStudents;
const DRAFT = data.grade.title;
const PUBLISHED = data.publishedGrade.title;

type Bearer = { Authorization: string };
type Book = {
  course: { id: string };
  periodId: string;
  buckets: { columns: { id: string; title: string }[] }[];
  rows: { student: { id: string; firstName: string }; cells: { gradeId: string; updatedAt: string | null }[] }[];
};

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function courseId(request: APIRequestContext, headers: Bearer) {
  const list = (await (
    await request.get('/api/v1/courses', { headers, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
  ).json()) as { data: { id: string; name: string }[] };
  const course = list.data.find((c) => c.name === data.courses.teacherOwn.name);
  if (!course) throw new Error('teacher course not seeded');
  return course.id;
}

/** A student's draft cell as the API has it now: ids and the `updatedAt` a save must carry. */
async function draftCell(request: APIRequestContext, headers: Bearer, id: string, firstName = BETO) {
  const book = (await (await request.get(`/api/v1/gradebook/${id}`, { headers })).json()) as Book;
  const columns = book.buckets.flatMap((b) => b.columns);
  const index = columns.findIndex((c) => c.title === DRAFT);
  const row = book.rows.find((r) => r.student.firstName === firstName);
  if (index < 0 || !row) throw new Error(`draft column or ${firstName} not found`);
  return { periodId: book.periodId, gradeId: columns[index].id, studentId: row.student.id, updatedAt: row.cells[index].updatedAt };
}

const cell = (page: Page, student: string, column: string) =>
  page.getByRole('textbox', { name: new RegExp(`^${student} .*, ${column}$`) });
const row = (page: Page, student: string) =>
  page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: new RegExp(`^${student} `) }) });

test.describe('Gradebook entry @FR-ASM-001.4 @FR-ASM-001.6', () => {  test.use({ storageState: storageStatePath('teacher') });

  let teacher: Bearer;
  let id: string;

  test.beforeAll(async ({ request }) => {
    teacher = await bearerFor(request, personas.teacher.email);
    id = await courseId(request, teacher);
  });

  test.afterAll(async ({ request }) => {
    for (const student of [BETO, CARLA]) {
      const draft = await draftCell(request, teacher, id, student);
      await request.put(`/api/v1/gradebook/${id}/cells`, {
        headers: teacher,
        data: { periodId: draft.periodId, cells: [{ ...draft, score: null, excused: false }] },
      });
    }
  });

  test('types a column from the keyboard, recalculates and saves a draft @FR-ASM-001.5', async ({ page }) => {
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();

    await expect(cell(page, ANA, DRAFT)).toHaveValue('4.5');
    await expect(cell(page, ANA, PUBLISHED)).toHaveValue('4'); // published cells are inputs too (S04)
    await expect(page.getByText('Escala 1–5 · nota mínima 3 · escribe EX para exentar · Tab pasa al siguiente estudiante')).toBeVisible();

    await cell(page, BETO, DRAFT).fill('3');
    await cell(page, BETO, DRAFT).press('Enter');
    await expect(cell(page, CARLA, DRAFT)).toBeFocused();
    await expect(row(page, BETO)).toContainText('2.5');
    await expect(row(page, BETO)).toContainText('En riesgo');
    await expect(page.getByText('1 cambio sin guardar')).toBeVisible();

    await page.getByRole('button', { name: 'Guardar borrador' }).click();
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await expect(cell(page, BETO, DRAFT)).toHaveValue('3');
  });

  test('flags invalid values, blocks saving and discards @BR-ASM-001.2', async ({ page }) => {
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();

    await cell(page, CARLA, DRAFT).fill('7');
    await expect(cell(page, CARLA, DRAFT)).toHaveAttribute('aria-invalid', 'true');
    await expect(row(page, CARLA)).toContainText('Entre 1 y 5');
    await expect(page.getByText('1 valor inválido')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled();

    await page.getByRole('button', { name: 'Descartar' }).click();
    await expect(cell(page, CARLA, DRAFT)).toHaveValue('');
  });

  test('EX excuses a student, left out of the average @FR-ASM-001.10 @BR-ASM-001.3', async ({ page, request }) => {
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await expect(page.getByText('escribe EX para exentar', { exact: false })).toBeVisible();

    await cell(page, CARLA, DRAFT).fill('ex');
    await expect(cell(page, CARLA, DRAFT)).not.toHaveAttribute('aria-invalid', 'true');
    // Carla's only score is "Taller E2E" 4.5: being excused leaves it as her average.
    await expect(row(page, CARLA)).toContainText('4.5');
    await page.getByRole('button', { name: 'Guardar borrador' }).click();
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await expect(cell(page, CARLA, DRAFT)).toHaveValue('EX');

    // The API refuses a cell that is both excused and scored.
    const carla = await draftCell(request, teacher, id, CARLA);
    const res = await request.put(`/api/v1/gradebook/${id}/cells`, {
      headers: teacher,
      data: { periodId: carla.periodId, cells: [{ ...carla, score: 4, excused: true }] },
    });
    expect(res.status()).toBe(400);
  });

  test('restores unsaved cells after a reload', async ({ page }) => {
    await page.goto(`/courses/${id}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await cell(page, CARLA, DRAFT).fill('4');
    await expect(page.getByText('1 cambio sin guardar')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.reload();
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await expect(page.getByText('Recuperamos cambios sin guardar.')).toBeVisible();
    await expect(cell(page, CARLA, DRAFT)).toHaveValue('4');

    await page.getByRole('button', { name: 'Descartar' }).click();
    await expect(cell(page, CARLA, DRAFT)).toHaveValue('EX'); // back to its saved value (excused above)
  });
});

test.describe('Gradebook save rules @BR-ASM-001.7 @BR-ASM-001.1', () => {
  test('a stale save is refused with 409, and another teacher with 403', async ({ request }) => {
    const teacher = await bearerFor(request, personas.teacher.email);
    const id = await courseId(request, teacher);
    const beto = await draftCell(request, teacher, id);
    const save = (headers: Bearer, updatedAt: string | null, score: number | null) =>
      request.put(`/api/v1/gradebook/${id}/cells`, {
        headers,
        data: { periodId: beto.periodId, cells: [{ gradeId: beto.gradeId, studentId: beto.studentId, score, updatedAt }] },
      });

    const first = await save(teacher, beto.updatedAt, 4);
    expect(first.ok()).toBeTruthy();
    const stale = await save(teacher, beto.updatedAt, 5);
    expect(stale.status()).toBe(409);
    expect(((await stale.json()) as { message: string }).message).toBe('Otra persona cambió estas notas; revisa antes de guardar');

    const other = await bearerFor(request, personas.otherTeacher.email);
    expect((await save(other, null, 3)).status()).toBe(403);

    const { updatedAt } = await draftCell(request, teacher, id);
    expect((await save(teacher, updatedAt, null)).ok()).toBeTruthy();
  });
});
