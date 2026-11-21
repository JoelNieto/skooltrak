import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ASM-001-S09: the course gradebook (ASM-001-S02) shows the product's one average (BR-ASM-001.4): each bucket's mean,
 * weighted by bucket weight.
 * docs/product/slices/ASM-001-S09-one-average-formula.md
 *
 * Carla's only score in `teacher`'s course is 4.5 in `publishedGrade` (bucket "Pruebas", weight 100).
 * The spec adds a bucket "Trabajo diario E2E" (weight 40) with three draft columns where Carla scores 2:
 * - BR .4: (2 × 40 + 4.5 × 100) / 140 = 3.8;
 * - per-score weighting would give 3.1, and the grid's former plain mean 2.6.
 *
 * Runs in the `after` project (playwright.config.ts): the draft columns would change the pending
 * counts other specs assert. Everything it creates is deleted again.
 */

const CARLA = data.relatedStudents[2];
const EXPECTED = '3.8';
const DAILY = { name: 'Trabajo diario E2E', weight: 40 };

type Bearer = { Authorization: string };
type Column = { id: string; title: string; periodId: string; studentGrades: { id: string; student?: { firstName: string } }[] };

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Course grid average @BR-ASM-001.4', () => {
  test.describe.configure({ mode: 'serial' });

  let teacher: Bearer;
  let courseId: string;
  let bucketId: string | undefined;
  const gradeIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    teacher = await bearerFor(request, personas.teacher.email);
    const courses = (await (
      await request.get('/api/v1/courses', { headers: teacher, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
    ).json()) as { data: { id: string; name: string }[] };
    const course = courses.data.find((c) => c.name === data.courses.teacherOwn.name);
    if (!course) throw new Error(`course "${data.courses.teacherOwn.name}" not seeded`);
    courseId = course.id;

    const columns = async () =>
      (await (await request.get(`/api/v1/grades/by-course/${courseId}`, { headers: teacher })).json()) as Column[];
    const published = (await columns()).find((g) => g.title === data.publishedGrade.title);
    if (!published) throw new Error(`grade "${data.publishedGrade.title}" not seeded`);

    const bucket = await request.post('/api/v1/grade-buckets', { headers: teacher, data: { ...DAILY, courseId } });
    expect(bucket.ok()).toBeTruthy();
    bucketId = ((await bucket.json()) as { id: string }).id;

    for (const title of ['Tarea 1 E2E', 'Tarea 2 E2E', 'Tarea 3 E2E']) {
      const res = await request.post('/api/v1/grades', {
        headers: teacher,
        data: { title, courseId, bucketId, periodId: published.periodId, date: new Date().toISOString(), published: false },
      });
      expect(res.ok()).toBeTruthy();
      gradeIds.push(((await res.json()) as { id: string }).id);
    }

    for (const column of (await columns()).filter((g) => gradeIds.includes(g.id))) {
      const row = column.studentGrades.find((sg) => sg.student?.firstName === CARLA);
      if (!row) throw new Error(`no row for ${CARLA} in ${column.title}`);
      const res = await request.patch('/api/v1/student-grades', { headers: teacher, data: { id: row.id, score: 2 } });
      expect(res.ok()).toBeTruthy();
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of gradeIds) await request.delete(`/api/v1/grades/${id}`, { headers: teacher });
    if (bucketId) await request.delete(`/api/v1/grade-buckets/${bucketId}`, { headers: teacher });
  });

  test("the teacher's course grid weights each bucket's mean @BR-ASM-001.4", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('teacher') });
    const page = await context.newPage();

    await page.goto(`/courses/${courseId}`);
    await page.getByRole('tab', { name: 'Libro de calificaciones' }).click();
    await expect(page.getByRole('columnheader', { name: 'Tarea 3 E2E' })).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: CARLA }).first();
    await expect(row).toContainText(EXPECTED);

    await context.close();
  });
});
