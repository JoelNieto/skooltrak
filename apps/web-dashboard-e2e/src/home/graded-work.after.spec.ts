import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S10: work linked to a published grade reads "Calificada · {score}", or "Exenta" when the
 * student is excused (FR-ACA-001.17, BR-ACA-001.6), on the student's and the parent's home.
 * docs/product/slices/ACA-001-S10-graded-status.md
 *
 * Links two of `teacher`'s seeded assignments to new columns and publishes them, for Ana (the
 * `student` persona, linked to `parent`): "Examen E2E" scored 4, "Tarea pendiente E2E" excused.
 * Other specs don't use these two assignments. afterAll deletes the columns.
 */

test.describe.configure({ mode: 'serial' });

const ANA = data.relatedStudents[0];
const EXAM = data.studentWork.inClass.title;
const HOMEWORK = data.studentWork.pending.title;

type Bearer = { Authorization: string };

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

const workRow = (page: Page, title: string) => page.getByRole('listitem').filter({ has: page.getByRole('link', { name: title, exact: true }) });

test.describe('Graded work status @FR-ACA-001.17 @BR-ACA-001.6', () => {
  let teacher: Bearer;
  let courseId: string;
  const columns: string[] = [];

  test.beforeAll(async ({ request }) => {
    teacher = await bearerFor(request, personas.teacher.email);
    const courses = (await (
      await request.get('/api/v1/courses', { headers: teacher, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
    ).json()) as { data: { id: string; name: string }[] };
    courseId = courses.data.find((c) => c.name === data.courses.teacherOwn.name)?.id as string;
    const { assignments } = (await (await request.get(`/api/v1/gradebook/${courseId}/assignments`, { headers: teacher })).json()) as {
      assignments: { id: string; title: string }[];
    };
    const book = (await (await request.get(`/api/v1/gradebook/${courseId}`, { headers: teacher })).json()) as {
      periodId: string;
      buckets: { id: string }[];
      rows: { student: { id: string; firstName: string } }[];
    };
    const ana = book.rows.find((r) => r.student.firstName === ANA)?.student.id;

    for (const [title, cell] of [
      [EXAM, { score: 4 }],
      [HOMEWORK, { score: null, excused: true }],
    ] as const) {
      const assignmentId = assignments.find((a) => a.title === title)?.id;
      const res = await request.post('/api/v1/grades', {
        headers: teacher,
        data: { title, courseId, bucketId: book.buckets[0].id, periodId: book.periodId, date: new Date().toISOString(), published: false, assignmentId },
      });
      expect(res.ok()).toBeTruthy();
      const gradeId = ((await res.json()) as { id: string }).id;
      columns.push(gradeId);
      const fresh = (await (await request.get(`/api/v1/gradebook/${courseId}`, { headers: teacher })).json()) as {
        rows: { student: { id: string }; cells: { gradeId: string; updatedAt: string | null }[] }[];
      };
      const updatedAt = fresh.rows.find((r) => r.student.id === ana)?.cells.find((c) => c.gradeId === gradeId)?.updatedAt ?? null;
      const saved = await request.put(`/api/v1/gradebook/${courseId}/cells`, {
        headers: teacher,
        data: { periodId: book.periodId, cells: [{ gradeId, studentId: ana, updatedAt, ...cell }] },
      });
      expect(saved.ok()).toBeTruthy();
    }
    const published = await request.post(`/api/v1/gradebook/${courseId}/publish`, { headers: teacher, data: { gradeIds: columns } });
    expect(published.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    for (const id of columns) await request.delete(`/api/v1/grades/${id}`, { headers: teacher });
  });

  test("the student's home shows Calificada · 4.0 and Exenta", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('student') });
    const page = await context.newPage();
    await page.goto('/');
    await expect(workRow(page, EXAM)).toContainText('Calificada · 4.0');
    await expect(workRow(page, HOMEWORK)).toContainText('Exenta');
    await context.close();
  });

  test("the parent's home shows them for the child", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('parent') });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByText('Calificada · 4.0')).toBeVisible();
    await expect(page.getByText('Exenta', { exact: true })).toBeVisible();
    await context.close();
  });
});
