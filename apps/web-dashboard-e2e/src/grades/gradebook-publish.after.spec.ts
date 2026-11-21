import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ASM-001-S04: correcting a published score needs a reason and is kept in the cell's history;
 * draft columns are published from the gradebook.
 * docs/product/slices/ASM-001-S04-publish-revisions.md
 *
 * Uses Ana's "Taller E2E" score (published, 4): the other `after` specs use Beto's and Carla's cells.
 * Creates a draft column "Publicar E2E" to publish. afterAll puts Ana's score back to 4 (that change
 * is also a revision: revisions are never deleted) and deletes the column.
 */

test.describe.configure({ mode: 'serial' });

const ANA = data.relatedStudents[0];
const PUBLISHED = data.publishedGrade.title;
const NEW_COLUMN = 'Publicar E2E';
const REASON = 'Error de transcripción E2E';

type Bearer = { Authorization: string };
type Book = {
  course: { id: string };
  periodId: string;
  buckets: { id: string; name: string; columns: { id: string; title: string; published: boolean }[] }[];
  rows: { student: { id: string; firstName: string }; cells: { gradeId: string; score: number | null; updatedAt: string | null }[] }[];
};

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function loadBook(request: APIRequestContext, headers: Bearer): Promise<Book> {
  const list = (await (
    await request.get('/api/v1/courses', { headers, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
  ).json()) as { data: { id: string; name: string }[] };
  const course = list.data.find((c) => c.name === data.courses.teacherOwn.name);
  if (!course) throw new Error('teacher course not seeded');
  return (await (await request.get(`/api/v1/gradebook/${course.id}`, { headers })).json()) as Book;
}

/** Ana's cell in a column: what a save must send. */
function anaCell(book: Book, title: string) {
  const columns = book.buckets.flatMap((b) => b.columns);
  const index = columns.findIndex((c) => c.title === title);
  const row = book.rows.find((r) => r.student.firstName === ANA);
  if (index < 0 || !row) throw new Error(`no cell for ${ANA} in ${title}`);
  return { gradeId: columns[index].id, studentId: row.student.id, score: row.cells[index].score, updatedAt: row.cells[index].updatedAt };
}

const cell = (page: Page, column: string) => page.getByRole('textbox', { name: new RegExp(`^${ANA} .*, ${column}$`) });

async function openGradebook(page: Page, courseId: string) {
  await page.goto(`/courses/${courseId}`);
  await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
}

test.describe('Published scores and publishing @FR-ASM-001.7 @FR-ASM-001.9', () => {
  test.use({ storageState: storageStatePath('teacher') });
  let teacher: Bearer;
  let courseId: string;
  let newColumnId: string | undefined;

  test.beforeAll(async ({ request }) => {
    teacher = await bearerFor(request, personas.teacher.email);
    const book = await loadBook(request, teacher);
    courseId = book.course.id;
    const bucket = book.buckets.find((b) => b.columns.some((c) => c.title === PUBLISHED));
    const res = await request.post('/api/v1/grades', {
      headers: teacher,
      data: { title: NEW_COLUMN, courseId, bucketId: bucket?.id, periodId: book.periodId, date: new Date().toISOString(), published: false },
    });
    expect(res.ok()).toBeTruthy();
    newColumnId = ((await res.json()) as { id: string }).id;
  });

  test.afterAll(async ({ request }) => {
    const book = await loadBook(request, teacher);
    const ana = anaCell(book, PUBLISHED);
    if (ana.score !== 4) {
      await request.put(`/api/v1/gradebook/${courseId}/cells`, {
        headers: teacher,
        data: { periodId: book.periodId, reason: 'Restaurar dato de prueba E2E', cells: [{ ...ana, score: 4 }] },
      });
    }
    if (newColumnId) await request.delete(`/api/v1/grades/${newColumnId}`, { headers: teacher });
  });

  test('a published score needs a reason, and the change is in the history @BR-ASM-001.8 @FR-ASM-001.8', async ({
    page,
    request,
  }) => {
    // The API refuses the change without a reason.
    const book = await loadBook(request, teacher);
    const refused = await request.put(`/api/v1/gradebook/${courseId}/cells`, {
      headers: teacher,
      data: { periodId: book.periodId, cells: [{ ...anaCell(book, PUBLISHED), score: 3.5 }] },
    });
    expect(refused.status()).toBe(400);
    expect(((await refused.json()) as { message: string }).message).toBe('Indica el motivo del cambio');

    await openGradebook(page, courseId);
    await cell(page, PUBLISHED).fill('3.5');
    await page.getByRole('button', { name: 'Guardar borrador' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Cambias 1 nota publicada.')).toBeVisible();
    await dialog.getByLabel('Motivo del cambio').fill(REASON);
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible();

    await cell(page, PUBLISHED).focus();
    const panel = page.getByRole('complementary', { name: 'Detalle de la celda' });
    await expect(panel).toContainText(PUBLISHED);
    await expect(panel.getByRole('list', { name: 'Historial de cambios' })).toContainText('4 → 3.5');
    await expect(panel.getByRole('list', { name: 'Historial de cambios' })).toContainText(REASON);
  });

  test('publishes a chosen draft column @BR-ASM-001.9', async ({ page }) => {
    await openGradebook(page, courseId);
    const header = page.getByRole('columnheader', { name: new RegExp(NEW_COLUMN) });
    await expect(header).toContainText('Borrador');

    await page.getByRole('button', { name: 'Publicar calificaciones' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('checkbox', { name: new RegExp(`^${NEW_COLUMN}`) }).check();
    await dialog.getByRole('button', { name: /^Publicar \d/ }).click();

    await expect(page.getByText('Calificación publicada')).toBeVisible();
    await expect(header).not.toContainText('Borrador');
  });
});
