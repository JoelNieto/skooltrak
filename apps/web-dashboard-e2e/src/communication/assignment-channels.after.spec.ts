import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * COM-003-S02: every assignment gets its Q&A channel (FR .17), which closes 3 days after the
 * assignment's latest date (FR .18, BR .11). docs/product/slices/COM-003-S02-assignment-channels.md
 *
 * The teacher's course "Matemáticas 7° E2E" has Ana (`student`) in group "7°A E2E"; `parent` is her
 * guardian; `otherTeacher` teaches another course. Assignments are created here through the API.
 * An `after` spec: new channels change channel counts other specs assert.
 */
test.describe.configure({ mode: 'serial' });

const API = '/api/v1/communication';
const DAY = 86_400_000;
const OPEN = 'Fracciones S02 E2E';
const LATE = 'Repaso S02 E2E';

type Headers = Record<string, string>;
type Summary = {
  id: string;
  name: string;
  scope: string;
  assignmentId: string | null;
  closesAt: string | null;
  archived: boolean;
  audienceStudents: boolean;
  audienceParents: boolean;
  studentsCanReply: boolean;
  replyVisibility: string;
};
type Detail = Summary & { canReply: boolean; posts: { id: string; body: string; pinned: boolean }[] };

async function bearer(request: APIRequestContext, persona: keyof typeof personas): Promise<Headers> {
  const res = await request.post('/api/v1/auth/login', {
    data: { email: personas[persona].email, password: E2E_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function channelsOf(request: APIRequestContext, headers: Headers) {
  return (await (await request.get(`${API}/channels`, { headers })).json()) as Summary[];
}

let teacher: Headers;
let courseId: string;
let groupId: string;
let teacherId: string | undefined;
const assignments: Record<string, string> = {};

async function createAssignment(request: APIRequestContext, title: string, inDays: number[]) {
  const res = await request.post('/api/v1/assignments', {
    headers: teacher,
    data: {
      title,
      details: '',
      type: 'HOMEWORK',
      date: new Date().toISOString(),
      courseId,
      schoolId: 'ignored',
      requireSubmission: false,
      teacherId,
      groupDates: inDays.map((d) => ({ date: new Date(Date.now() + d * DAY).toISOString(), classGroupId: groupId })),
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return ((await res.json()) as { id: string }).id;
}

async function channelFor(request: APIRequestContext, headers: Headers, assignmentId: string) {
  return (await channelsOf(request, headers)).find((c) => c.scope === 'ASSIGNMENT' && c.assignmentId === assignmentId);
}

test.beforeAll(async ({ request }) => {
  teacher = await bearer(request, 'teacher');
  const targets = async (scope: string) =>
    (await (await request.get(`${API}/channels/targets`, { headers: teacher, params: { scope } })).json()) as {
      id: string;
      name: string;
    }[];
  courseId = (await targets('COURSE')).find((t) => t.name === data.courses.teacherOwn.name)?.id as string;
  groupId = (await targets('CLASS_GROUP')).find((t) => t.name === data.classGroups.related)?.id as string;
  const courses = (await (
    await request.get('/api/v1/courses', {
      headers: teacher,
      params: { search: data.courses.teacherOwn.name, pageSize: 10 },
    })
  ).json()) as { data: { id: string; teacherId?: string | null }[] };
  teacherId = courses.data.find((c) => c.id === courseId)?.teacherId ?? undefined;
  expect(courseId && groupId).toBeTruthy();
});

test('creating an assignment creates its Q&A channel with a pinned post @FR-COM-003.17 @BR-COM-003.10', async ({
  request,
}) => {
  assignments[OPEN] = await createAssignment(request, OPEN, [2]);

  const mine = await channelFor(request, teacher, assignments[OPEN]);
  expect(mine).toMatchObject({
    name: OPEN,
    audienceStudents: true,
    audienceParents: false,
    studentsCanReply: true,
    replyVisibility: 'PUBLIC',
    archived: false,
  });
  // BR .11: the latest date + 3 days.
  expect(Math.abs(new Date(mine?.closesAt as string).getTime() - (Date.now() + 5 * DAY))).toBeLessThan(10 * 60_000);

  const student = await bearer(request, 'student');
  expect(await channelFor(request, student, assignments[OPEN])).toBeTruthy();
  expect(await channelFor(request, await bearer(request, 'parent'), assignments[OPEN])).toBeUndefined();

  const detail = (await (await request.get(`${API}/channels/${mine?.id}`, { headers: student })).json()) as Detail;
  expect(detail.posts[0]).toMatchObject({
    pinned: true,
    body: `Preguntas sobre «${OPEN}». Pregunten aquí; todos ven las respuestas.`,
  });
  expect(detail.canReply).toBe(true);
});

test('students ask by replying under the pinned post, and never post @FR-COM-003.17 @BR-COM-003.1', async ({
  request,
}) => {
  const student = await bearer(request, 'student');
  const channel = await channelFor(request, teacher, assignments[OPEN]);
  const detail = (await (await request.get(`${API}/channels/${channel?.id}`, { headers: student })).json()) as Detail;
  const pinned = detail.posts.find((p) => p.pinned)?.id;

  const reply = await request.post(`${API}/channels/${channel?.id}/posts/${pinned}/replies`, {
    headers: student,
    data: { body: '¿Se simplifica cada resultado? (S02)' },
  });
  expect(reply.ok()).toBeTruthy();
  const post = await request.post(`${API}/channels/${channel?.id}/posts`, { headers: student, data: { body: 'Hola' } });
  expect(post.status()).toBe(403);
});

test('is never created directly @BR-COM-003.10', async ({ request }) => {
  const res = await request.post(`${API}/channels`, {
    headers: teacher,
    data: {
      scope: 'ASSIGNMENT',
      targetId: assignments[OPEN],
      name: 'x',
      audienceStudents: true,
      audienceParents: false,
    },
  });
  expect(res.status()).toBe(400);
});

test('closes 3 days after the latest date, and new dates move the close time @FR-COM-003.18 @BR-COM-003.11', async ({
  request,
}) => {
  assignments[LATE] = await createAssignment(request, LATE, [-4]);
  const student = await bearer(request, 'student');

  const closed = await channelFor(request, student, assignments[LATE]);
  expect(closed?.archived).toBe(true);
  const detail = (await (await request.get(`${API}/channels/${closed?.id}`, { headers: student })).json()) as Detail;
  expect(detail.canReply).toBe(false);
  const pinned = detail.posts.find((p) => p.pinned)?.id;
  const refused = await request.post(`${API}/channels/${closed?.id}/posts/${pinned}/replies`, {
    headers: student,
    data: { body: 'Hola' },
  });
  expect(refused.status()).toBe(403);

  const update = await request.patch('/api/v1/assignments', {
    headers: teacher,
    data: {
      id: assignments[LATE],
      groupDates: [{ date: new Date(Date.now() + DAY).toISOString(), classGroupId: groupId }],
    },
  });
  expect(update.ok(), await update.text()).toBeTruthy();
  expect((await channelFor(request, student, assignments[LATE]))?.archived).toBe(false);
});

test('a teacher of another course neither sees nor manages it @BR-COM-003.10', async ({ request }) => {
  const channel = await channelFor(request, teacher, assignments[OPEN]);
  const other = await bearer(request, 'otherTeacher');
  expect((await request.get(`${API}/channels/${channel?.id}`, { headers: other })).status()).toBe(404);
  expect(
    (await request.post(`${API}/channels/${channel?.id}/posts`, { headers: other, data: { body: 'x' } })).status(),
  ).toBe(403);
});

test.describe('on the channel page', () => {
  test.use({ storageState: storageStatePath('student') });

  test('shows the pinned post and when the channel closes @FR-COM-003.17 @FR-COM-003.18', async ({ page, request }) => {
    const channel = await channelFor(request, teacher, assignments[OPEN]);
    await page.goto(`/communication/channels/${channel?.id}`);
    await expect(page.getByRole('article').first()).toContainText('Fijado');
    await expect(page.getByText(/Cierra el \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
  });
});

test('deleting the assignment deletes its channel @BR-COM-003.10', async ({ request }) => {
  const channel = await channelFor(request, teacher, assignments[LATE]);
  expect((await request.delete(`/api/v1/assignments/${assignments[LATE]}`, { headers: teacher })).ok()).toBeTruthy();
  expect((await request.get(`${API}/channels/${channel?.id}`, { headers: teacher })).status()).toBe(404);
});
