import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * COM-003 — the only two ways to communicate: channels and direct messages.
 * docs/product/frd/COM-003-channels-and-direct.md
 *
 * The teacher's course "Matemáticas 7° E2E" has Ana, Beto and Carla on its roster; `parent` (Paula)
 * is the guardian of Ana and Beto; `student` is Ana. Tests run in order and share the channel.
 */
test.describe.configure({ mode: 'serial' });

const API = '/api/v1/communication';
const parentName = `${personas.parent.firstName} ${personas.parent.lastName}`;
const channelName = 'Avisos Matemáticas E2E';
const postBody = 'El jueves hay prueba del capítulo 3. Por favor confirmen que lo leyeron.';

async function bearer(request: APIRequestContext, persona: keyof typeof personas) {
  const res = await request.post('/api/v1/auth/login', { data: { email: personas[persona].email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function target(request: APIRequestContext, headers: Record<string, string>, scope: string, name: string) {
  const targets = (await (await request.get(`${API}/channels/targets?scope=${scope}`, { headers })).json()) as {
    id: string;
    name: string;
  }[];
  return targets.find((t) => t.name === name)?.id;
}

test.describe('Channels', () => {
  test('a teacher only reaches their own courses and related groups @BR-COM-003.1 @BR-COM-003.2', async ({ request }) => {
    const teacher = await bearer(request, 'teacher');
    const admin = await bearer(request, 'admin');

    expect(await target(request, teacher, 'CLASS_GROUP', data.classGroups.related)).toBeTruthy();
    // Homeroom alone does not count.
    expect(await target(request, teacher, 'CLASS_GROUP', data.classGroups.homeroomOnly)).toBeUndefined();
    expect(await target(request, teacher, 'COURSE', data.courses.otherTeachers.name)).toBeUndefined();

    const homeroomId = await target(request, admin, 'CLASS_GROUP', data.classGroups.homeroomOnly);
    const otherCourseId = await target(request, admin, 'COURSE', data.courses.otherTeachers.name);
    const base = { name: 'No permitido', audienceStudents: true, audienceParents: true };
    for (const body of [
      { ...base, scope: 'CLASS_GROUP', targetId: homeroomId },
      { ...base, scope: 'COURSE', targetId: otherCourseId },
      { ...base, scope: 'ORGANIZATION' },
    ]) {
      expect((await request.post(`${API}/channels`, { headers: teacher, data: body })).status()).toBe(403);
    }
    // Parents and students never create channels.
    const parent = await bearer(request, 'parent');
    expect((await request.post(`${API}/channels`, { headers: parent, data: { ...base, scope: 'ORGANIZATION' } })).status()).toBe(403);
  });

  test.describe('as the teacher', () => {
    test.use({ storageState: storageStatePath('teacher') });

    test('creates a course channel and publishes a post that asks for confirmation @FR-COM-003.1 @FR-COM-003.6 @FR-COM-003.9', async ({
      page,
    }) => {
      await page.goto('/communication/channels/new');
      // Teachers only get the course and group levels.
      await expect(page.locator('#scope option')).toHaveText(['Curso', 'Grupo']);
      await page.locator('#scope').selectOption({ label: 'Curso' });
      // selectOption's label takes a string only: pick the option whose text names the course.
      const target = page.locator('#target option', { hasText: data.courses.teacherOwn.name });
      await page.locator('#target').selectOption((await target.getAttribute('value')) as string);
      await page.locator('#name').fill(channelName);
      await page.getByLabel('Los acudientes pueden responder').check();
      await expect(page.getByLabel('Privadas')).toBeChecked();
      await page.getByRole('button', { name: 'Crear canal' }).click();

      await expect(page.getByRole('heading', { name: channelName })).toBeVisible();
      await page.getByRole('textbox', { name: 'Mensaje' }).fill(postBody);
      await page.getByLabel('Requiere confirmación de lectura').check();
      await page.getByRole('button', { name: 'Publicar' }).click();

      const post = page.getByRole('article').filter({ hasText: postBody });
      await expect(post).toContainText('Leído por 0 de');
      await expect(post).toContainText('Confirmado por 0 de');
    });
  });

  test.describe('as the parent', () => {
    test.use({ storageState: storageStatePath('parent') });

    test('sees the channel, confirms reading and replies privately @FR-COM-003.7 @FR-COM-003.8 @FR-COM-003.10', async ({ page }) => {
      await page.goto('/communication/channels');
      const row = page.getByRole('link', { name: new RegExp(channelName) });
      await expect(row.getByLabel('1 sin leer')).toBeVisible();
      await row.click();

      const post = page.getByRole('article').filter({ hasText: postBody });
      await expect(post.getByText('Nuevo')).toBeVisible();
      await post.getByRole('button', { name: 'Confirmar lectura' }).click();
      await expect(post.getByText(/Confirmaste la lectura/)).toBeVisible();

      await post.getByRole('button', { name: 'Responder' }).click();
      await expect(post.getByText('Tu respuesta solo la ven los administradores del canal.')).toBeVisible();
      await post.getByPlaceholder('Escribe una respuesta…').fill('Enterada, gracias.');
      await post.getByPlaceholder('Escribe una respuesta…').press('Enter');
      await expect(post.getByText('Enterada, gracias.')).toBeVisible();
    });
  });

  test.describe('as the student', () => {
    test.use({ storageState: storageStatePath('student') });

    test('reads the channel but cannot reply, and never sees direct messages @BR-COM-003.5 @BR-COM-003.7', async ({ page, request }) => {
      await page.goto('/communication/channels');
      await page.getByRole('link', { name: new RegExp(channelName) }).click();
      const post = page.getByRole('article').filter({ hasText: postBody });
      await expect(post).toBeVisible();
      await expect(post.getByRole('button', { name: 'Responder' })).toHaveCount(0);
      // Private replies: the parent's answer is not visible to the student.
      await expect(page.getByText('Enterada, gracias.')).toHaveCount(0);

      await expect(page.getByRole('link', { name: 'Mensajes directos' })).toHaveCount(0);
      const student = await bearer(request, 'student');
      expect((await request.get(`${API}/direct`, { headers: student })).status()).toBe(403);
    });
  });

  test.describe('back as the teacher', () => {
    test.use({ storageState: storageStatePath('teacher') });

    test('sees who confirmed and answers the parent in their private conversation @FR-COM-003.9 @FR-COM-003.10', async ({ page }) => {
      await page.goto('/communication/channels');
      await page.getByRole('link', { name: new RegExp(channelName) }).click();
      const post = page.getByRole('article').filter({ hasText: postBody });
      await expect(post).toContainText('Confirmado por 1 de');

      await post.getByRole('button', { name: 'Ver detalle' }).click();
      await expect(post.getByRole('row').filter({ hasText: parentName })).not.toContainText('—');

      await post.getByRole('button', { name: /Respuestas \(1\)/ }).click();
      await expect(post.getByText('Enterada, gracias.')).toBeVisible();
      const composer = post.getByPlaceholder(`Responder a ${parentName}…`);
      await composer.fill('Gracias a usted.');
      await composer.press('Enter');
      await expect(post.getByText('Gracias a usted.')).toBeVisible();
    });
  });
});
