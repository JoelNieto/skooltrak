import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ASM-001-S08: a published score below the pass mark alerts the homeroom teacher of the student's
 * group, once per student and grade, never the grading teacher (BR-ASM-001.12); they see it in the
 * notifications inbox and on their home page.
 * docs/product/slices/ASM-001-S08-homeroom-alert.md
 *
 * Setup: `otherTeacher` becomes the homeroom teacher of `related` (7°A); `teacher` publishes a new
 * column where Beto has 2 (pass mark 3). afterAll clears the homeroom teacher and deletes the column.
 */

test.describe.configure({ mode: 'serial' });

const BETO = data.relatedStudents[1];
const COLUMN = 'Alerta consejero E2E';
const TYPE = 'LOW_GRADE_HOMEROOM';

type Bearer = { Authorization: string };
type Notifications = { notifications: { id: string; message: string; relatedId: string | null }[]; unread: number };

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function alertsFor(request: APIRequestContext, headers: Bearer) {
  const res = await request.get('/api/v1/notifications', { headers, params: { type: TYPE } });
  return ((await res.json()) as Notifications).notifications.filter((n) => n.message.includes(COLUMN));
}

test.describe('Homeroom alert @FR-ASM-001.14 @BR-ASM-001.12', () => {
  let admin: Bearer;
  let teacher: Bearer;
  let homeroom: Bearer;
  let courseId: string;
  let groupId: string;
  let gradeId: string | undefined;

  test.beforeAll(async ({ request }) => {
    [admin, teacher, homeroom] = await Promise.all([
      bearerFor(request, personas.admin.email),
      bearerFor(request, personas.teacher.email),
      bearerFor(request, personas.otherTeacher.email),
    ]);
    const courses = (await (
      await request.get('/api/v1/courses', { headers: teacher, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
    ).json()) as { data: { id: string; name: string }[] };
    courseId = courses.data.find((c) => c.name === data.courses.teacherOwn.name)?.id as string;

    const book = (await (await request.get(`/api/v1/gradebook/${courseId}`, { headers: teacher })).json()) as {
      periodId: string;
      classGroups: { id: string; name: string }[];
      buckets: { id: string }[];
      rows: { student: { id: string; firstName: string } }[];
    };
    groupId = book.classGroups.find((g) => g.name === data.classGroups.related)?.id as string;

    const teachers = (await (
      await request.get('/api/v1/teachers', { headers: admin, params: { search: personas.otherTeacher.firstName, pageSize: 10 } })
    ).json()) as { data: { id: string; firstName: string }[] };
    const other = teachers.data.find((t) => t.firstName === personas.otherTeacher.firstName);
    expect(other).toBeTruthy();
    expect((await request.patch('/api/v1/class-groups', { headers: admin, data: { id: groupId, teacherId: other?.id } })).ok()).toBeTruthy();

    // A new draft column where Beto has 2, then published.
    const created = await request.post('/api/v1/grades', {
      headers: teacher,
      data: { title: COLUMN, courseId, bucketId: book.buckets[0].id, periodId: book.periodId, date: new Date().toISOString(), published: false },
    });
    expect(created.ok()).toBeTruthy();
    gradeId = ((await created.json()) as { id: string }).id;
    const beto = book.rows.find((r) => r.student.firstName === BETO)?.student.id;
    const fresh = (await (await request.get(`/api/v1/gradebook/${courseId}`, { headers: teacher })).json()) as {
      buckets: { columns: { id: string }[] }[];
      rows: { student: { id: string }; cells: { gradeId: string; updatedAt: string | null }[] }[];
    };
    const cell = fresh.rows.find((r) => r.student.id === beto)?.cells.find((c) => c.gradeId === gradeId);
    const saved = await request.put(`/api/v1/gradebook/${courseId}/cells`, {
      headers: teacher,
      data: { periodId: book.periodId, cells: [{ gradeId, studentId: beto, score: 2, updatedAt: cell?.updatedAt ?? null }] },
    });
    expect(saved.ok()).toBeTruthy();
    expect((await request.post(`/api/v1/gradebook/${courseId}/publish`, { headers: teacher, data: { gradeIds: [gradeId] } })).ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    if (groupId) await request.patch('/api/v1/class-groups', { headers: admin, data: { id: groupId, teacherId: null } });
    if (gradeId) await request.delete(`/api/v1/grades/${gradeId}`, { headers: teacher });
    await request.patch('/api/v1/notifications/read', { headers: homeroom });
  });

  test('the homeroom teacher gets one alert; the grading teacher none', async ({ request }) => {
    await expect.poll(async () => (await alertsFor(request, homeroom)).length, { timeout: 15_000 }).toBe(1);
    const [alert] = await alertsFor(request, homeroom);
    expect(alert.message).toBe(
      `${BETO} E2E (${data.classGroups.related}) obtuvo 2.0 en «${COLUMN}» de ${data.courses.teacherOwn.name}. Nota mínima: 3.0.`,
    );
    expect(await alertsFor(request, teacher)).toEqual([]);

    // Corrected again, still below the pass mark: no second alert.
    const book = (await (await request.get(`/api/v1/gradebook/${courseId}`, { headers: teacher })).json()) as {
      periodId: string;
      rows: { student: { id: string; firstName: string }; cells: { gradeId: string; updatedAt: string | null }[] }[];
    };
    const row = book.rows.find((r) => r.student.firstName === BETO);
    const cell = row?.cells.find((c) => c.gradeId === gradeId);
    const again = await request.put(`/api/v1/gradebook/${courseId}/cells`, {
      headers: teacher,
      data: {
        periodId: book.periodId,
        reason: 'Corrección E2E',
        cells: [{ gradeId, studentId: row?.student.id, score: 1.5, updatedAt: cell?.updatedAt ?? null }],
      },
    });
    expect(again.ok()).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(await alertsFor(request, homeroom)).toHaveLength(1);
  });

  test('the alert is in the inbox and on the teacher home', async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('otherTeacher') });
    const page = await context.newPage();

    await page.goto('/');
    const card = page.getByRole('region', { name: 'Notas bajo la nota mínima en tu grupo' });
    await expect(card).toContainText(`«${COLUMN}»`);

    await page.getByRole('link', { name: /^Notificaciones/ }).first().click();
    await expect(page).toHaveURL(/\/notifications$/);
    const item = page.getByRole('button', { name: 'Sin leer: Nota bajo la nota mínima' }).filter({ hasText: COLUMN });
    await expect(item).toBeVisible();
    await item.click();
    await expect(page.getByRole('button', { name: 'Nota bajo la nota mínima' }).filter({ hasText: COLUMN })).toBeVisible();
    await context.close();
  });
});
