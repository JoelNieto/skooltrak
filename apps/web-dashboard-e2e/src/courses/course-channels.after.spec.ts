import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S15: the course's channels on the course page (FR-ACA-001.21, .22; BR .17–.19).
 * ACA-001-S16: their unread counts on Mis cursos (FR-ACA-001.23, .24).
 * docs/product/slices/ACA-001-S15-course-channels.md, ACA-001-S16-mis-cursos-channels.md
 *
 * Channels are created here through the COM-003 API, as `channels.spec.ts` does. This file is an
 * `after` spec so that spec's channel on the same course already exists and no longer changes. So
 * the counts below come from the API, and the rows are found by the names created here.
 * `student` is Ana, on the course's roster; `parent` is her guardian.
 */
test.describe.configure({ mode: 'serial' });

const API = '/api/v1/communication';
const ANNOUNCEMENTS = 'Anuncios S15 E2E';
const GENERAL = 'General S15 E2E';
const GROUP = 'Grupo S15 E2E';
const ANNOUNCEMENT_POST = 'Mañana no hay clase de Matemáticas.';
const GENERAL_POSTS = ['¿Alguien tiene la guía del capítulo 3?', 'Traigan compás el viernes.'];

type Headers = Record<string, string>;
type Summary = { id: string; name: string; scope: string; courseId: string | null; archived: boolean; unread: number };

let courseId: string;
const ids: Record<string, string> = {};

async function bearer(request: APIRequestContext, persona: keyof typeof personas): Promise<Headers> {
  const res = await request.post('/api/v1/auth/login', {
    data: { email: personas[persona].email, password: E2E_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function targetId(request: APIRequestContext, headers: Headers, scope: string, name: string) {
  const targets = (await (await request.get(`${API}/channels/targets`, { headers, params: { scope } })).json()) as {
    id: string;
    name: string;
  }[];
  const id = targets.find((t) => t.name === name)?.id;
  expect(id, `${scope} target ${name}`).toBeTruthy();
  return id as string;
}

async function createChannel(request: APIRequestContext, headers: Headers, body: object, posts: string[]) {
  const res = await request.post(`${API}/channels`, { headers, data: body });
  expect(res.ok()).toBeTruthy();
  const { id } = (await res.json()) as { id: string };
  for (const post of posts) {
    expect((await request.post(`${API}/channels/${id}/posts`, { headers, data: { body: post } })).ok()).toBeTruthy();
  }
  return id;
}

/** Unread posts in open COURSE channels for `persona`: of this course, or of every course. */
async function expectedUnread(request: APIRequestContext, persona: 'student' | 'parent', anyCourse = false) {
  const list = (await (
    await request.get(`${API}/channels`, { headers: await bearer(request, persona) })
  ).json()) as Summary[];
  return list
    .filter((c) => c.scope === 'COURSE' && (anyCourse || c.courseId === courseId) && !c.archived)
    .reduce((sum, c) => sum + c.unread, 0);
}

const nuevos = (n: number) => (n === 1 ? '1 nuevo' : `${n} nuevos`);
const mensajes = (n: number) => (n === 1 ? '1 mensaje nuevo.' : `${n} mensajes nuevos.`);
const channelsTab = (page: Page) => page.getByRole('tab', { name: /^Canales/ });
const channelsList = (page: Page) => page.getByRole('list', { name: 'Canales del curso' });

test.beforeAll(async ({ request }) => {
  const teacher = await bearer(request, 'teacher');
  courseId = await targetId(request, teacher, 'COURSE', data.courses.teacherOwn.name);
  const groupId = await targetId(request, teacher, 'CLASS_GROUP', data.classGroups.related);

  ids[ANNOUNCEMENTS] = await createChannel(
    request,
    teacher,
    { scope: 'COURSE', targetId: courseId, name: ANNOUNCEMENTS, audienceStudents: true, audienceParents: true },
    [ANNOUNCEMENT_POST],
  );
  ids[GENERAL] = await createChannel(
    request,
    teacher,
    {
      scope: 'COURSE',
      targetId: courseId,
      name: GENERAL,
      audienceStudents: true,
      audienceParents: false,
      studentsCanReply: true,
      replyVisibility: 'PUBLIC',
    },
    GENERAL_POSTS,
  );
  // BR-ACA-001.17: a class-group channel of Ana's group never shows on a course.
  ids[GROUP] = await createChannel(
    request,
    teacher,
    { scope: 'CLASS_GROUP', targetId: groupId, name: GROUP, audienceStudents: true, audienceParents: true },
    ['Reunión de grupo el lunes.'],
  );
});

test.describe('as a student @FR-ACA-001.21 @FR-ACA-001.22', () => {
  test.use({ storageState: storageStatePath('student') });

  test('the Canales tab lists the course channels with their kind and unread count', async ({ page, request }) => {
    const unread = await expectedUnread(request, 'student');
    expect(unread).toBeGreaterThanOrEqual(3);

    await page.goto(`/courses/${courseId}`);
    const tabs = page.getByRole('tablist', { name: 'Secciones del curso' }).getByRole('tab');
    await expect(tabs).toHaveText([
      /Resumen/,
      /Asignaciones/,
      /Calificaciones/,
      /Canales/,
      /Participantes/,
      /Recursos/,
    ]);
    await expect(channelsTab(page)).toContainText(nuevos(unread));

    await channelsTab(page).click();
    const list = channelsList(page);
    const announcements = list.getByRole('link', { name: new RegExp(ANNOUNCEMENTS) });
    await expect(announcements).toContainText('Solo anuncios');
    await expect(announcements).toContainText('1 nuevo');
    await expect(announcements).toContainText(ANNOUNCEMENT_POST);

    const general = list.getByRole('link', { name: new RegExp(GENERAL) });
    await expect(general).toContainText('Conversación del curso');
    await expect(general).toContainText('2 nuevos');
    await expect(general).toContainText(GENERAL_POSTS[1]);

    await expect(list.getByRole('link', { name: new RegExp(GROUP) })).toHaveCount(0);
  });

  test('Resumen shows a Canales card, latest post first, and "Ver todos" opens the tab', async ({ page }) => {
    await page.goto(`/courses/${courseId}`);
    const card = page.getByRole('region', { name: 'Canales' });
    const names = await card.getByRole('link').allTextContents();
    const general = names.findIndex((t) => t.includes(GENERAL));
    const announcements = names.findIndex((t) => t.includes(ANNOUNCEMENTS));
    expect(general).toBeGreaterThanOrEqual(0);
    // Its posts are newer, unless a newer channel pushed Anuncios past the card's 3 rows.
    if (announcements >= 0) expect(general).toBeLessThan(announcements);

    await card.getByRole('button', { name: 'Ver todos' }).click();
    await expect(channelsTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test('opening a channel marks it read, and the course page counts it', async ({ page, request }) => {
    const before = await expectedUnread(request, 'student');
    await page.goto(`/courses/${courseId}`);
    await channelsTab(page).click();
    await channelsList(page)
      .getByRole('link', { name: new RegExp(GENERAL) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/communication/channels/${ids[GENERAL]}`));
    await expect(page.getByText(GENERAL_POSTS[1])).toBeVisible();

    await expect.poll(() => expectedUnread(request, 'student')).toBe(before - 2);
    await page.goto(`/courses/${courseId}`);
    await expect(channelsTab(page)).toContainText(nuevos(before - 2));
    await channelsTab(page).click();
    await expect(channelsList(page).getByRole('link', { name: new RegExp(GENERAL) })).not.toContainText('nuevo');
  });

  test('with no channels the tab says so and Resumen has no card', async ({ page }) => {
    await page.route(`**${API}/channels`, (route) => route.fulfill({ json: [] }));
    await page.goto(`/courses/${courseId}`);
    await expect(page.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('region', { name: 'Canales' })).toHaveCount(0);
    await channelsTab(page).click();
    await expect(page.getByText('Este curso aún no tiene canales')).toBeVisible();
  });

  test('a failed list shows an inline error with "Reintentar"', async ({ page }) => {
    await page.route(`**${API}/channels`, (route) => route.fulfill({ status: 500, json: { message: 'boom' } }));
    await page.goto(`/courses/${courseId}`);
    await channelsTab(page).click();
    await expect(page.getByRole('alert')).toContainText('No se pudieron cargar los canales del curso');
    await expect(page.getByRole('button', { name: 'Reintentar' }).first()).toBeVisible();
    // The rest of the page still works.
    await page.getByRole('tab', { name: /Asignaciones/ }).click();
    await expect(page.getByRole('region', { name: 'Pasadas' })).toBeVisible();
  });
});

test.describe('on Mis cursos @FR-ACA-001.23 @FR-ACA-001.24', () => {
  test.use({ storageState: storageStatePath('student') });
  const card = (page: Page) =>
    page
      .getByRole('list', { name: 'Mis cursos' })
      .getByRole('link', { name: new RegExp(data.courses.teacherOwn.name) });
  const stats = (page: Page) => page.getByRole('group', { name: 'Resumen del periodo' });

  test("the card shows the course's unread posts and says so in its name; the stat sums them", async ({
    page,
    request,
  }) => {
    const unread = await expectedUnread(request, 'student');
    const total = await expectedUnread(request, 'student', true);
    expect(unread).toBeGreaterThan(0);

    await page.goto('/courses');
    await expect(card(page).locator('ui-course-cover')).toContainText(nuevos(unread));
    await expect(card(page)).toHaveAccessibleName(new RegExp(`${mensajes(unread).replace('.', '\\.')}$`));
    const stat = stats(page).locator('lib-stat-card', { hasText: 'Nuevo en canales' });
    await expect(stat).toContainText(`${total}`);
    await expect(stat).toContainText(/en \d+ cursos?/);
  });

  test('nothing unread: no badge and "Nada nuevo"', async ({ page }) => {
    await page.route(`**${API}/channels`, (route) => route.fulfill({ json: [] }));
    await page.goto('/courses');
    await expect(card(page).locator('ui-course-cover')).not.toContainText('nuevo');
    await expect(card(page)).not.toHaveAccessibleName(/mensajes? nuevos?/);
    await expect(stats(page).locator('lib-stat-card', { hasText: 'Nuevo en canales' })).toContainText('Nada nuevo');
  });

  test('a failed list keeps the cards and shows "—"', async ({ page }) => {
    await page.route(`**${API}/channels`, (route) => route.fulfill({ status: 500, json: { message: 'boom' } }));
    await page.goto('/courses');
    await expect(card(page)).toBeVisible();
    const stat = stats(page).locator('lib-stat-card', { hasText: 'Nuevo en canales' });
    await expect(stat).toContainText('—');
    await expect(stat).toContainText('No se pudieron cargar los canales');
  });
});

test.describe('as a parent @FR-ACA-001.21 @BR-ACA-001.17', () => {
  test.use({ storageState: storageStatePath('parent') });

  test('sees only the channels meant for parents', async ({ page }) => {
    await page.goto('/courses');
    await page
      .getByRole('group', { name: 'Elegir hijo' })
      .getByRole('button', { name: new RegExp(`^${data.relatedStudents[0]} `) })
      .click();
    await page
      .getByRole('list', { name: 'Mis cursos' })
      .getByRole('link', { name: new RegExp(data.courses.teacherOwn.name) })
      .click();
    await channelsTab(page).click();
    const list = channelsList(page);
    await expect(list.getByRole('link', { name: new RegExp(ANNOUNCEMENTS) })).toContainText('Solo anuncios');
    await expect(list.getByRole('link', { name: new RegExp(GENERAL) })).toHaveCount(0);
  });
});

test.describe('archived channels @FR-ACA-001.21', () => {
  test.use({ storageState: storageStatePath('student') });

  test('come last with "Archivado" and leave the Resumen card', async ({ page, request }) => {
    const teacher = await bearer(request, 'teacher');
    expect(
      (
        await request.patch(`${API}/channels/${ids[ANNOUNCEMENTS]}`, { headers: teacher, data: { archived: true } })
      ).ok(),
    ).toBeTruthy();

    await page.goto(`/courses/${courseId}`);
    await expect(
      page.getByRole('region', { name: 'Canales' }).getByRole('link', { name: new RegExp(ANNOUNCEMENTS) }),
    ).toHaveCount(0);
    await channelsTab(page).click();
    const last = channelsList(page).getByRole('listitem').last();
    await expect(last).toContainText(ANNOUNCEMENTS);
    await expect(last).toContainText('Archivado');
  });
});

test.describe('staff @BR-ACA-001.19', () => {
  test.use({ storageState: storageStatePath('teacher') });

  test('the course teacher keeps "Canal" and gets no Canales tab', async ({ page }) => {
    await page.goto(`/courses/${courseId}`);
    await expect(page.getByRole('button', { name: 'Canal' })).toBeVisible();
    await expect(channelsTab(page)).toHaveCount(0);
  });
});
