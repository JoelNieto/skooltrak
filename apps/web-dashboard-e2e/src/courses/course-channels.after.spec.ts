import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S15: the course's channels on the course page (FR-ACA-001.21, .22; BR .17–.19).
 * ACA-001-S16: their unread counts on Mis cursos (FR-ACA-001.23, .24).
 * ACA-001-S17: "Preguntar en el curso" opens the course conversation (FR-ACA-001.25).
 * ACA-001-S18: the chosen channel opens inside the Canales tab (FR-ACA-001.26).
 * ACA-001-S19: the course's teacher manages its channels in the same tab (FR-ACA-001.27).
 * ACA-001-S20: "por responder" for the teacher, per channel and on the tab (FR-ACA-001.28).
 * ACA-001-S21: assignment Q&A channels grouped in the tab, with their assignment card (FR-ACA-001.29).
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
    .filter((c) =>
      // Mis cursos (S16) counts COURSE channels of every course; the Canales tab also counts its
      // assignments' Q&A channels (FR-ACA-001.29).
      anyCourse ? c.scope === 'COURSE' : (c.scope === 'COURSE' || c.scope === 'ASSIGNMENT') && c.courseId === courseId,
    )
    .filter((c) => !c.archived)
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
    const announcements = list.getByRole('button', { name: new RegExp(ANNOUNCEMENTS) });
    await expect(announcements).toContainText('Solo anuncios');
    await expect(announcements).toContainText('1 nuevo');
    await expect(announcements).toContainText(ANNOUNCEMENT_POST);

    const general = list.getByRole('button', { name: new RegExp(GENERAL) });
    await expect(general).toContainText('Conversación del curso');
    await expect(general).toContainText('2 nuevos');
    await expect(general).toContainText(GENERAL_POSTS[1]);

    await expect(list.getByRole('button', { name: new RegExp(GROUP) })).toHaveCount(0);
  });

  test('Resumen shows a Canales card, latest post first, and "Ver todos" opens the tab', async ({ page }) => {
    await page.goto(`/courses/${courseId}`);
    const card = page.getByRole('region', { name: 'Canales' });
    // allTextContents doesn't wait: let the card's rows load first.
    await expect(card.getByRole('button', { name: new RegExp(GENERAL) })).toBeVisible();
    const names = await card.getByRole('list').getByRole('button').allTextContents();
    const general = names.findIndex((t) => t.includes(GENERAL));
    const announcements = names.findIndex((t) => t.includes(ANNOUNCEMENTS));
    expect(general).toBeGreaterThanOrEqual(0);
    // Its posts are newer, unless a newer channel pushed Anuncios past the card's 3 rows.
    expect(announcements === -1 || general < announcements).toBe(true);

    await card.getByRole('button', { name: 'Ver todos' }).click();
    await expect(channelsTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test('opening a channel marks it read, and the course page counts it @FR-ACA-001.26', async ({ page, request }) => {
    const before = await expectedUnread(request, 'student');
    await page.goto(`/courses/${courseId}`);
    await channelsTab(page).click();
    await channelsList(page)
      .getByRole('button', { name: new RegExp(GENERAL) })
      .click();
    // S18: it opens beside the list, and the course page stays.
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}\\?canal=${ids[GENERAL]}`));
    // The post itself (its text is also the row's preview in the list).
    await expect(page.getByRole('article').filter({ hasText: GENERAL_POSTS[1] })).toBeVisible();

    await expect.poll(() => expectedUnread(request, 'student')).toBe(before - 2);
    await page.goto(`/courses/${courseId}`);
    await expect(channelsTab(page)).toContainText(nuevos(before - 2));
    await channelsTab(page).click();
    await expect(channelsList(page).getByRole('button', { name: new RegExp(GENERAL) })).not.toContainText('nuevo');
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

test.describe('inside the Canales tab @FR-ACA-001.26', () => {
  test.use({ storageState: storageStatePath('student') });
  const opened = (page: Page) => page.getByRole('heading', { level: 2 });

  test('nothing opens until a channel is chosen; then it opens beside the list', async ({ page }) => {
    await page.goto(`/courses/${courseId}`);
    await channelsTab(page).click();
    await expect(page.getByText('Elige un canal para leerlo')).toBeVisible();

    await channelsList(page)
      .getByRole('button', { name: new RegExp(ANNOUNCEMENTS) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}\\?canal=${ids[ANNOUNCEMENTS]}`));
    await expect(opened(page).filter({ hasText: ANNOUNCEMENTS })).toBeVisible();
    await expect(channelsList(page).getByRole('button', { name: new RegExp(ANNOUNCEMENTS) })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('link', { name: 'Abrir en pantalla completa' })).toHaveAttribute(
      'href',
      `/communication/channels/${ids[ANNOUNCEMENTS]}`,
    );
    // Announcements only: no reply box.
    await expect(page.getByRole('button', { name: 'Responder' })).toHaveCount(0);
  });

  test('confirms an announcement without leaving the course', async ({ page, request }) => {
    const teacher = await bearer(request, 'teacher');
    const body = 'Confirmen que leyeron la guía S18.';
    expect(
      (
        await request.post(`${API}/channels/${ids[ANNOUNCEMENTS]}/posts`, {
          headers: teacher,
          data: { body, requiresConfirmation: true },
        })
      ).ok(),
    ).toBeTruthy();

    await page.goto(`/courses/${courseId}?canal=${ids[ANNOUNCEMENTS]}`);
    await expect(channelsTab(page)).toHaveAttribute('aria-selected', 'true');
    const post = page.getByRole('article').filter({ hasText: body });
    await post.getByRole('button', { name: 'Confirmar lectura' }).click();
    await expect(post).toContainText('Confirmaste la lectura');
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}`));

    const detail = (await (
      await request.get(`${API}/channels/${ids[ANNOUNCEMENTS]}`, { headers: await bearer(request, 'student') })
    ).json()) as { posts: { body: string; confirmedAt: string | null }[] };
    expect(detail.posts.find((p) => p.body === body)?.confirmedAt).toBeTruthy();
  });

  test('replies in a public channel without leaving the course', async ({ page }) => {
    const reply = '¿Sirve un compás de plástico? (S18)';
    await page.goto(`/courses/${courseId}?canal=${ids[GENERAL]}`);
    const latest = page.getByRole('article').filter({ hasText: GENERAL_POSTS[1] });
    await latest.getByRole('button', { name: /Responder|Respuestas/ }).click();
    await latest.getByRole('textbox', { name: 'Escribe una respuesta…' }).fill(reply);
    await latest.getByRole('button', { name: 'Enviar' }).click();
    await expect(latest).toContainText(reply);
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}`));
  });

  test('never opens a channel outside the course (BR-ACA-001.17)', async ({ page }) => {
    await page.goto(`/courses/${courseId}?canal=${ids[GROUP]}`);
    await expect(channelsTab(page)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Elige un canal para leerlo')).toBeVisible();
    await expect(opened(page).filter({ hasText: GROUP })).toHaveCount(0);
  });

  test('the Resumen card opens the channel in the tab', async ({ page }) => {
    await page.goto(`/courses/${courseId}`);
    await page
      .getByRole('region', { name: 'Canales' })
      .getByRole('button', { name: new RegExp(GENERAL) })
      .click();
    await expect(channelsTab(page)).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(new RegExp(`\\?canal=${ids[GENERAL]}`));
    await expect(opened(page).filter({ hasText: GENERAL })).toBeVisible();
  });

  test('on a phone the channel replaces the list until "Volver a canales"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/courses/${courseId}`);
    await channelsTab(page).click();
    await channelsList(page)
      .getByRole('button', { name: new RegExp(GENERAL) })
      .click();
    await expect(channelsList(page)).toBeHidden();
    await page.getByRole('button', { name: 'Volver a canales' }).click();
    await expect(channelsList(page)).toBeVisible();
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
    await expect(list.getByRole('button', { name: new RegExp(ANNOUNCEMENTS) })).toContainText('Solo anuncios');
    await expect(list.getByRole('button', { name: new RegExp(GENERAL) })).toHaveCount(0);
  });
});

test.describe('the course teacher @FR-ACA-001.27 @BR-ACA-001.19', () => {
  test.use({ storageState: storageStatePath('teacher') });
  const QUESTIONS = 'Preguntas S19 E2E';
  const QUESTION = '¿El ejercicio 4 es fracción mixta? (S19)';

  test('gets the Canales tab instead of the "Canal" button', async ({ page }) => {
    await page.goto(`/courses/${courseId}`);
    await expect(channelsTab(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Canal', exact: true })).toHaveCount(0);
    await channelsTab(page).click();
    await expect(page.getByText('Elige un canal para publicar o responder')).toBeVisible();
  });

  test('publishes with a read confirmation and sees who read it, inside the course', async ({ page }) => {
    const body = 'Recuerden traer la guía resuelta. (S19)';
    await page.goto(`/courses/${courseId}?canal=${ids[ANNOUNCEMENTS]}`);
    await expect(channelsTab(page)).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('textbox', { name: 'Mensaje' }).fill(body);
    await page.getByLabel('Requiere confirmación de lectura').check();
    await page.getByRole('button', { name: 'Publicar' }).click();

    const post = page.getByRole('article').filter({ hasText: body });
    await expect(post).toContainText(/Leído por 0 de \d+/);
    await expect(post).toContainText(/Confirmado por 0 de \d+/);
    await post.getByRole('button', { name: 'Ver detalle' }).click();
    await expect(post.locator('app-channel-receipts')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}`));
  });

  test('answers a private question inside the course', async ({ page, request }) => {
    const teacher = await bearer(request, 'teacher');
    ids[QUESTIONS] = await createChannel(
      request,
      teacher,
      {
        scope: 'COURSE',
        targetId: courseId,
        name: QUESTIONS,
        audienceStudents: true,
        audienceParents: false,
        studentsCanReply: true,
        replyVisibility: 'PRIVATE',
      },
      ['Pregunten aquí; solo yo veo sus preguntas.'],
    );
    const detail = (await (
      await request.get(`${API}/channels/${ids[QUESTIONS]}`, { headers: await bearer(request, 'student') })
    ).json()) as { posts: { id: string }[] };
    expect(
      (
        await request.post(`${API}/channels/${ids[QUESTIONS]}/posts/${detail.posts[0].id}/replies`, {
          headers: await bearer(request, 'student'),
          data: { body: QUESTION },
        })
      ).ok(),
    ).toBeTruthy();

    await page.goto(`/courses/${courseId}`);
    await channelsTab(page).click();
    const row = channelsList(page).getByRole('button', { name: new RegExp(QUESTIONS) });
    await expect(row).toContainText('Preguntas al docente');
    await row.click();
    const post = page.getByRole('article').first();
    await post.getByRole('button', { name: /Respuestas/ }).click();
    await expect(post).toContainText(QUESTION);
    await expect(post).toContainText(data.relatedStudents[0]);
  });

  test('shows "por responder" on the tab and the rows, and clears it on answering @FR-ACA-001.28', async ({
    page,
    request,
  }) => {
    const waiting = async () => {
      const list = (await (
        await request.get(`${API}/channels`, { headers: await bearer(request, 'teacher') })
      ).json()) as (Summary & {
        toAnswer: number;
      })[];
      const course = list.filter((c) => c.scope === 'COURSE' && c.courseId === courseId && !c.archived);
      return {
        total: course.reduce((n, c) => n + c.toAnswer, 0),
        questions: course.find((c) => c.id === ids[QUESTIONS])?.toAnswer,
      };
    };
    const before = await waiting();
    // Ana's question in the previous test has no answer yet.
    expect(before.questions).toBe(1);

    await page.goto(`/courses/${courseId}`);
    await expect(channelsTab(page)).toContainText(`${before.total} por responder`);
    await channelsTab(page).click();
    const row = channelsList(page).getByRole('button', { name: new RegExp(QUESTIONS) });
    await expect(row).toContainText('1 por responder');

    await row.click();
    const post = page.getByRole('article').first();
    await post.getByRole('button', { name: /Respuestas/ }).click();
    await post.getByRole('textbox', { name: /^Responder a / }).fill('Sí, es fracción mixta. (S20)');
    await post.getByRole('button', { name: 'Enviar' }).click();

    // The tab refreshes its counts after the reply (BR-COM-003.12: a manager's reply answers it).
    await expect(row).not.toContainText('por responder');
    const after = before.total - 1;
    await expect(channelsTab(page)).toContainText(after ? `${after} por responder` : 'Canales');
    expect((await waiting()).questions).toBe(0);
  });

  test('"Nuevo canal para este curso" and "Configurar" open the COM-003 forms', async ({ page }) => {
    await page.goto(`/courses/${courseId}`);
    await channelsTab(page).click();
    await page.getByRole('button', { name: 'Nuevo canal para este curso' }).click();
    await expect(page).toHaveURL(new RegExp(`/communication/channels/new\\?scope=COURSE&targetId=${courseId}`));

    await page.goto(`/courses/${courseId}?canal=${ids[GENERAL]}`);
    await page.getByRole('button', { name: 'Configurar' }).click();
    await expect(page).toHaveURL(new RegExp(`/communication/channels/${ids[GENERAL]}/edit`));
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
      page.getByRole('region', { name: 'Canales' }).getByRole('button', { name: new RegExp(ANNOUNCEMENTS) }),
    ).toHaveCount(0);
    await channelsTab(page).click();
    const last = channelsList(page).getByRole('listitem').last();
    await expect(last).toContainText(ANNOUNCEMENTS);
    await expect(last).toContainText('Archivado');
  });
});

test.describe('"Preguntar en el curso" @FR-ACA-001.25', () => {
  const ask = (page: Page) => page.getByRole('button', { name: 'Preguntar en el curso' });
  /** A COURSE channel of this course as COM-003 lists it, for stubbed lists. */
  const summary = (id: string, over: Record<string, unknown>) => ({
    id,
    scope: 'COURSE',
    targetName: data.courses.teacherOwn.name,
    schoolId: null,
    studyPlanId: null,
    classGroupId: null,
    courseId,
    name: id,
    description: '',
    audienceStudents: true,
    audienceParents: false,
    studentsCanReply: false,
    parentsCanReply: false,
    replyVisibility: 'PRIVATE',
    archived: false,
    role: 'MEMBER',
    unread: 0,
    lastPostAt: '2026-11-01T10:00:00.000Z',
    lastPostPreview: 'Hola',
    ...over,
  });
  const talk = { studentsCanReply: true, replyVisibility: 'PUBLIC' };

  test.describe('as a student', () => {
    test.use({ storageState: storageStatePath('student') });

    test('opens a course conversation channel', async ({ page }) => {
      await page.goto(`/courses/${courseId}`);
      await expect(ask(page)).toBeVisible();
      await ask(page).click();
      // S18: it opens inside the Canales tab.
      await expect(page).toHaveURL(new RegExp(`/courses/${courseId}\\?canal=[^&]+$`));
      await expect(channelsTab(page)).toHaveAttribute('aria-selected', 'true');
    });

    test('goes to the open conversation with the latest post', async ({ page }) => {
      const list = [
        summary('announcements', { lastPostAt: '2026-11-23T10:00:00.000Z' }),
        summary('older-talk', { ...talk, lastPostAt: '2026-11-01T10:00:00.000Z' }),
        summary('newer-talk', { ...talk, lastPostAt: '2026-11-20T10:00:00.000Z' }),
        summary('archived-talk', { ...talk, archived: true, lastPostAt: '2026-11-24T10:00:00.000Z' }),
      ];
      await page.route(`**${API}/channels`, (route) => route.fulfill({ json: list }));
      await page.goto(`/courses/${courseId}`);
      await ask(page).click();
      await expect(page).toHaveURL(/\?canal=newer-talk$/);
    });

    test('falls back to a channel with private replies', async ({ page }) => {
      const list = [
        summary('announcements', { lastPostAt: '2026-11-23T10:00:00.000Z' }),
        summary('questions', { studentsCanReply: true, replyVisibility: 'PRIVATE' }),
      ];
      await page.route(`**${API}/channels`, (route) => route.fulfill({ json: list }));
      await page.goto(`/courses/${courseId}`);
      await ask(page).click();
      await expect(page).toHaveURL(/\?canal=questions$/);
    });

    test('is hidden when students can reply in no open channel', async ({ page }) => {
      const list = [summary('announcements', {}), summary('archived-talk', { ...talk, archived: true })];
      await page.route(`**${API}/channels`, (route) => route.fulfill({ json: list }));
      await page.goto(`/courses/${courseId}`);
      await expect(page.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'true');
      await expect(ask(page)).toHaveCount(0);
    });
  });

  test.describe('as a parent', () => {
    test.use({ storageState: storageStatePath('parent') });

    test('is for students only', async ({ page }) => {
      await page.goto('/courses');
      await page
        .getByRole('group', { name: 'Elegir hijo' })
        .getByRole('button', { name: new RegExp(`^${data.relatedStudents[0]} `) })
        .click();
      await page
        .getByRole('list', { name: 'Mis cursos' })
        .getByRole('link', { name: new RegExp(data.courses.teacherOwn.name) })
        .click();
      await expect(page.getByRole('tab', { name: 'Resumen' })).toBeVisible();
      await expect(ask(page)).toHaveCount(0);
    });
  });
});

test.describe('assignment Q&A channels @FR-ACA-001.29', () => {
  const TITLE = 'Guía S21 E2E';
  let assignmentId: string;

  test.beforeAll(async ({ request }) => {
    const teacher = await bearer(request, 'teacher');
    const groupId = await targetId(request, teacher, 'CLASS_GROUP', data.classGroups.related);
    const courses = (await (
      await request.get('/api/v1/courses', {
        headers: teacher,
        params: { search: data.courses.teacherOwn.name, pageSize: 10 },
      })
    ).json()) as { data: { id: string; teacherId?: string | null }[] };
    const res = await request.post('/api/v1/assignments', {
      headers: teacher,
      data: {
        title: TITLE,
        details: '',
        type: 'HOMEWORK',
        date: new Date().toISOString(),
        courseId,
        schoolId: 'ignored',
        requireSubmission: false,
        teacherId: courses.data.find((c) => c.id === courseId)?.teacherId ?? undefined,
        groupDates: [{ date: new Date(Date.now() + 2 * 86_400_000).toISOString(), classGroupId: groupId }],
      },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    assignmentId = ((await res.json()) as { id: string }).id;
  });

  test.describe('as a student', () => {
    test.use({ storageState: storageStatePath('student') });

    test('groups it under "Preguntas por asignación" and opens it with its assignment', async ({ page }) => {
      await page.goto(`/courses/${courseId}`);
      await channelsTab(page).click();
      const group = page.getByRole('list', { name: 'Preguntas por asignación' });
      const row = group.getByRole('button', { name: new RegExp(TITLE) });
      await expect(row).toContainText(/Cierra el \d{2}\/\d{2}\/\d{4}/);
      // Not among the course channels.
      await expect(channelsList(page).getByRole('button', { name: new RegExp(TITLE) })).toHaveCount(0);

      await row.click();
      // The card, above the posts (the row's name is the same title, so scope to the card).
      const card = page.locator('div', { has: page.getByRole('link', { name: 'Ver asignación' }) }).last();
      await expect(card).toContainText(TITLE);
      await expect(page.getByText(/Tarea · Entrega: \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Ver asignación' })).toHaveAttribute(
        'href',
        `/assignments/${assignmentId}`,
      );
      await expect(page.getByRole('article').first()).toContainText('Fijado');
    });

    test('"Preguntar en el curso" still goes to a course channel', async ({ page }) => {
      await page.goto(`/courses/${courseId}`);
      await page.getByRole('button', { name: 'Preguntar en el curso' }).click();
      await expect(
        page.getByRole('list', { name: 'Canales del curso' }).getByRole('button', { pressed: true }),
      ).toHaveCount(1);
    });
  });

  test.describe('as the teacher', () => {
    test.use({ storageState: storageStatePath('teacher') });

    test('sees the same group and card', async ({ page }) => {
      await page.goto(`/courses/${courseId}`);
      await channelsTab(page).click();
      await page
        .getByRole('list', { name: 'Preguntas por asignación' })
        .getByRole('button', { name: new RegExp(TITLE) })
        .click();
      await expect(page.getByRole('link', { name: 'Ver asignación' })).toBeVisible();
      await expect(page.getByText(/Tarea · Entrega/)).toBeVisible();
    });
  });
});
