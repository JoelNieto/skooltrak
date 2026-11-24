import { expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S02, S03: a student's *Mis cursos* (FR-ACA-001.4, .5, .6).
 * docs/product/slices/ACA-001-S02-mis-cursos.md
 *
 * Ana (`student`) is enrolled in `teacher`'s course, which meets her group every day in "Aula 7"
 * (seeded slots, Monday to Sunday). Her only published score there is 4 in "Taller E2E" (bucket
 * weight 100, pass mark 3), so the card reads 4.0 / 5 "Al día". Read-only.
 */

test.describe('Mis cursos @FR-ACA-001.4 @FR-ACA-001.5 @FR-ACA-001.6', () => {
  test.use({ storageState: storageStatePath('student') });

  test("the student's card shows schedule, teacher and period average", async ({ page }) => {
    await page.goto('/courses');
    await expect(page.getByRole('heading', { name: 'Mis cursos' })).toBeVisible();

    const card = page.getByRole('list', { name: 'Mis cursos' }).getByRole('link', { name: new RegExp(data.courses.teacherOwn.name) });
    await expect(card).toContainText('Todos los días · Aula 7');
    await expect(card).toContainText(`${personas.teacher.firstName} ${personas.teacher.lastName}`);
    await expect(card).toContainText('4.0');
    await expect(card).toContainText('Al día');
    // §8: the card's one accessible name sums it up; unread channel posts may close it (FR .23).
    await expect(card).toHaveAccessibleName(
      new RegExp(`^${data.courses.teacherOwn.name}, Prof\\. .+\\. Promedio 4\\.0, Al día\\. Próxima: .+, Vencida desde .+\\. \\d de 4 completadas\\.( \\d+ mensajes? nuevos?\\.)?$`),
    );

    // FR-ACA-001.5: always the current period; the switcher lives only in Calificaciones (FR .14).
    await expect(page.getByLabel('Periodo')).toHaveCount(0);

    // ACA-001-S03. Ana's group has 4 assignments this period; the oldest overdue one leads.
    await expect(card).toContainText(data.studentWork.overdue.title);
    await expect(card).toContainText('Vencida desde');
    await expect(card.getByRole('progressbar', { name: /de 4 completadas$/ })).toBeVisible();
    const stats = page.getByRole('group', { name: 'Resumen del periodo' });
    await expect(stats).toContainText('Promedio del periodo');
    await expect(stats).toContainText('Esta semana');
    await expect(stats).toContainText(/\d de 4/);

    await card.click();
    await expect(page).toHaveURL(/\/courses\/.+/);
  });

  test('only students and parents of a student get cards', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', { data: { email: personas.teacher.email, password: E2E_PASSWORD } });
    const { accessToken } = (await login.json()) as { accessToken: string };
    const res = await request.get('/api/v1/courses/mine', { headers: { Authorization: `Bearer ${accessToken}` } });
    expect(res.status()).toBe(403);
  });
});

/**
 * ACA-001-S05: a parent sees *Mis cursos* for the child chosen in the switcher (FR-ACA-001.8).
 * `parent` is linked to Ana and Beto; Beto's only published score in `teacher`'s course is 2.
 */
test.describe('Mis cursos for parents @FR-ACA-001.8 @BR-ACA-001.2', () => {
  test.use({ storageState: storageStatePath('parent') });
  const [ANA, BETO, CARLA] = data.relatedStudents;

  test("shows the chosen child's courses", async ({ page }) => {
    await page.goto('/courses');
    const switcher = page.getByRole('group', { name: 'Elegir hijo' });
    await switcher.getByRole('button', { name: new RegExp(`^${BETO} `) }).click();
    await expect(page.getByRole('heading', { name: `Cursos de ${BETO}` })).toBeVisible();
    const card = page.getByRole('list', { name: 'Mis cursos' }).getByRole('link', { name: new RegExp(data.courses.teacherOwn.name) });
    await expect(card).toContainText('2.0');
    await expect(card).toContainText('En riesgo');

    await switcher.getByRole('button', { name: new RegExp(`^${ANA} `) }).click();
    await expect(page.getByRole('heading', { name: `Cursos de ${ANA}` })).toBeVisible();
    await expect(card).toContainText('4.0');
  });

  test('refuses a child who is not linked', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', { data: { email: personas.parent.email, password: E2E_PASSWORD } });
    const headers = { Authorization: `Bearer ${((await login.json()) as { accessToken: string }).accessToken}` };
    const teacherLogin = await request.post('/api/v1/auth/login', { data: { email: personas.teacher.email, password: E2E_PASSWORD } });
    const teacher = { Authorization: `Bearer ${((await teacherLogin.json()) as { accessToken: string }).accessToken}` };
    const courses = (await (
      await request.get('/api/v1/courses', { headers: teacher, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
    ).json()) as { data: { id: string; name: string }[] };
    const id = courses.data.find((c) => c.name === data.courses.teacherOwn.name)?.id;
    const book = (await (await request.get(`/api/v1/gradebook/${id}`, { headers: teacher })).json()) as {
      rows: { student: { id: string; firstName: string } }[];
    };
    const carla = book.rows.find((r) => r.student.firstName === CARLA)?.student.id;
    const res = await request.get('/api/v1/courses/mine', { headers, params: { studentId: carla as string } });
    expect(res.status()).toBe(403);
  });
});

