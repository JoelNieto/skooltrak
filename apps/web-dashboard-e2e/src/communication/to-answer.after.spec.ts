import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * COM-003-S03: managers see how many replies are waiting for their answer (FR .19, BR .12).
 * docs/product/slices/COM-003-S03-to-answer.md
 *
 * The teacher's related group "7°A E2E" has Ana (`student`); `parent` (Paula) is her guardian, so
 * both can be members who reply. CLASS_GROUP channels are used so the course-channel specs that run
 * alongside (`courses/course-channels.after.spec.ts`) never count these. An `after` spec.
 */
test.describe.configure({ mode: 'serial' });

const API = '/api/v1/communication';
const PRIVATE = 'Preguntas S03 E2E';
const PUBLIC = 'General S03 E2E';

type Headers = Record<string, string>;
type Summary = { id: string; name: string; toAnswer: number };

async function bearer(request: APIRequestContext, persona: keyof typeof personas): Promise<Headers> {
  const res = await request.post('/api/v1/auth/login', {
    data: { email: personas[persona].email, password: E2E_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

const h: Record<string, Headers> = {};
const ids: Record<string, string> = {};
const posts: Record<string, string> = {};

async function toAnswer(request: APIRequestContext, who: Headers, name: string) {
  const list = (await (await request.get(`${API}/channels`, { headers: who })).json()) as Summary[];
  return list.find((c) => c.name === name)?.toAnswer;
}

async function reply(request: APIRequestContext, who: Headers, name: string, body: string, threadUserId?: string) {
  const res = await request.post(`${API}/channels/${ids[name]}/posts/${posts[name]}/replies`, {
    headers: who,
    data: threadUserId ? { body, threadUserId } : { body },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

test.beforeAll(async ({ request }) => {
  for (const p of ['teacher', 'admin', 'student', 'parent'] as const) h[p] = await bearer(request, p);
  const targets = (await (
    await request.get(`${API}/channels/targets`, { headers: h['teacher'], params: { scope: 'CLASS_GROUP' } })
  ).json()) as { id: string; name: string }[];
  const groupId = targets.find((t) => t.name === data.classGroups.related)?.id;
  for (const [name, replyVisibility] of [
    [PRIVATE, 'PRIVATE'],
    [PUBLIC, 'PUBLIC'],
  ] as const) {
    const res = await request.post(`${API}/channels`, {
      headers: h['teacher'],
      data: {
        scope: 'CLASS_GROUP',
        targetId: groupId,
        name,
        audienceStudents: true,
        audienceParents: true,
        studentsCanReply: true,
        parentsCanReply: true,
        replyVisibility,
      },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    ids[name] = ((await res.json()) as { id: string }).id;
    const post = await request.post(`${API}/channels/${ids[name]}/posts`, {
      headers: h['teacher'],
      data: { body: 'Pregunten aquí.' },
    });
    posts[name] = ((await post.json()) as { id: string }).id;
  }
});

test('private: one per member conversation waiting for a manager @FR-COM-003.19 @BR-COM-003.12', async ({
  request,
}) => {
  expect(await toAnswer(request, h['teacher'], PRIVATE)).toBe(0);
  await reply(request, h['student'], PRIVATE, '¿El 4 es fracción mixta?');
  await reply(request, h['parent'], PRIVATE, '¿Ana puede entregar el viernes?');
  expect(await toAnswer(request, h['teacher'], PRIVATE)).toBe(2);

  const threads = (await (
    await request.get(`${API}/channels/${ids[PRIVATE]}/posts/${posts[PRIVATE]}/replies`, { headers: h['teacher'] })
  ).json()) as { member: { id: string; name: string } | null }[];
  const ana = threads.find((t) => t.member?.name.startsWith(personas.student.firstName))?.member?.id as string;
  await reply(request, h['teacher'], PRIVATE, 'Sí, es mixta.', ana);
  expect(await toAnswer(request, h['teacher'], PRIVATE)).toBe(1);

  await reply(request, h['student'], PRIVATE, '¡Gracias! ¿Y el 5?');
  expect(await toAnswer(request, h['teacher'], PRIVATE)).toBe(2);
});

test('public: member replies newer than any manager reply @BR-COM-003.12', async ({ request }) => {
  await reply(request, h['student'], PUBLIC, '¿Traemos compás?');
  await reply(request, h['parent'], PUBLIC, '¿Y transportador?');
  expect(await toAnswer(request, h['teacher'], PUBLIC)).toBe(2);

  // Any manager's reply answers it: here an admin of the organization.
  await reply(request, h['admin'], PUBLIC, 'Los dos, por favor.');
  expect(await toAnswer(request, h['teacher'], PUBLIC)).toBe(0);
  expect(await toAnswer(request, h['admin'], PUBLIC)).toBe(0);

  await reply(request, h['student'], PUBLIC, '¿Y regla?');
  expect(await toAnswer(request, h['teacher'], PUBLIC)).toBe(1);
});

test('members never get a count, and closed channels show none @BR-COM-003.12', async ({ request }) => {
  expect(await toAnswer(request, h['student'], PRIVATE)).toBe(0);
  expect(await toAnswer(request, h['parent'], PUBLIC)).toBe(0);

  const archive = await request.patch(`${API}/channels/${ids[PUBLIC]}`, {
    headers: h['teacher'],
    data: { archived: true },
  });
  expect(archive.ok()).toBeTruthy();
  expect(await toAnswer(request, h['teacher'], PUBLIC)).toBe(0);
});

test.describe('on the channels page', () => {
  test.use({ storageState: storageStatePath('teacher') });

  test('the teacher sees "{n} por responder" on the channel @FR-COM-003.19', async ({ page }) => {
    await page.goto('/communication/channels');
    const row = page.getByRole('link', { name: new RegExp(PRIVATE) });
    await expect(row).toContainText('2 por responder');
  });
});
