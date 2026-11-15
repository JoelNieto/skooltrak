import { expect, test } from '@playwright/test';
import { data, personas, storageStatePath } from '../support/fixtures';

/**
 * HOM-001-S04 — student home: next class, today's classes, upcoming and overdue work of the
 * student's own group (BR-HOM-001.8, .12).
 * docs/product/slices/HOM-001-S04-student-today-work.md
 *
 * `student` is the first related student. Their group has `teacher`'s course at 00:00 and 23:30
 * every day, so outside those half hours the next class is the 23:30 one.
 */

const teacherName = `${personas.teacher.firstName} ${personas.teacher.lastName}`;

test.describe('Student home', () => {
  test.use({ storageState: storageStatePath('student') });

  test("shows the next class and today's classes of the student's group @FR-HOM-001.12", async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: `Hola, ${personas.student.firstName}` })).toBeVisible();

    const strip = page.getByRole('list', { name: 'Clases de hoy' });
    await expect(strip.getByText(data.courses.teacherOwn.name)).toHaveCount(2);
    await expect(strip.getByText(data.courses.otherTeachers.name)).toHaveCount(0);

    const today = page.getByRole('region', { name: 'Hoy' });
    await expect(today.getByText(data.courses.teacherOwn.name).first()).toBeVisible();
    await expect(today.getByText(`Prof. ${teacherName}`).first()).toBeVisible();
  });

  test('lists overdue, handed-in, in-class and pending work in order, for the own group only @FR-HOM-001.14', async ({
    page,
  }) => {
    await page.goto('/home');
    const work = page.getByRole('region', { name: 'Próximas entregas y evaluaciones' });
    const rows = work.getByRole('listitem');

    const expected = [
      [data.studentWork.overdue.title, 'Vencida'],
      [data.assignment.title, 'Entregado'],
      [data.studentWork.inClass.title, 'Presencial'],
      [data.studentWork.pending.title, 'Pendiente'],
    ];
    await expect(rows).toHaveCount(expected.length);
    for (const [i, [title, status]] of expected.entries()) {
      await expect(rows.nth(i)).toContainText(title);
      await expect(rows.nth(i)).toContainText(status);
    }
    await expect(rows.nth(3).getByRole('link', { name: 'Entregar' })).toBeVisible();
    await expect(work.getByText(data.studentWork.otherGroup.title)).toHaveCount(0);
  });

  test('student endpoints refuse users without a student record @FR-HOM-001.12', async ({ page, request, browser }) => {
    await page.goto('/home');
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect((await request.get('/api/v1/home/student/today', { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(200);

    const teacherContext = await browser.newContext({ storageState: storageStatePath('teacher') });
    const teacherPage = await teacherContext.newPage();
    await teacherPage.goto('/login');
    const teacherToken = await teacherPage.evaluate(() => localStorage.getItem('access_token'));
    const asTeacher = await request.get('/api/v1/home/student/work', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(asTeacher.status()).toBe(403);
    await teacherContext.close();
  });
});
