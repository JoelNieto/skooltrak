import { APIRequestContext, expect, test } from '@playwright/test';
import { E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * COM-003 direct messages (staff ↔ parent). Runs after the other specs (`*.after.spec.ts`): it adds
 * a conversation about Beto, and the home specs assert on the parent's and teacher's messages.
 * docs/product/frd/COM-003-channels-and-direct.md
 */
test.describe.configure({ mode: 'serial' });

const API = '/api/v1/communication';
const parentName = `${personas.parent.firstName} ${personas.parent.lastName}`;

async function bearer(request: APIRequestContext, persona: keyof typeof personas) {
  const res = await request.post('/api/v1/auth/login', { data: { email: personas[persona].email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Direct messages', () => {
  test.describe('as the teacher', () => {
    test.use({ storageState: storageStatePath('teacher') });

    test("starts a conversation with a student's parent @FR-COM-003.12 @FR-COM-003.13", async ({ page }) => {
      await page.goto('/communication/direct');
      await page.getByRole('button', { name: 'Nuevo mensaje' }).first().click();
      await page.getByRole('searchbox', { name: 'Buscar estudiante o acudiente' }).fill('Beto');
      await page.getByRole('listitem').filter({ hasText: 'Beto' }).getByRole('button', { name: parentName }).click();

      await expect(page.getByRole('heading', { name: parentName })).toBeVisible();
      await expect(page.getByText('Sobre Beto E2E').first()).toBeVisible();
      await page.getByPlaceholder('Escribe un mensaje…').fill('Beto entregó un trabajo excelente hoy.');
      await page.getByPlaceholder('Escribe un mensaje…').press('Enter');
      await expect(page.getByText('Beto entregó un trabajo excelente hoy.')).toBeVisible();
    });
  });

  test.describe('as the parent', () => {
    test.use({ storageState: storageStatePath('parent') });

    test('replies, but cannot start conversations @FR-COM-003.13 @BR-COM-003.1', async ({ page, request }) => {
      await page.goto('/communication/direct');
      await expect(page.getByRole('button', { name: 'Nuevo mensaje' })).toHaveCount(0);
      await page.getByRole('link', { name: /Sobre Beto E2E/ }).click();
      await expect(page.getByText('Beto entregó un trabajo excelente hoy.')).toBeVisible();
      await page.getByPlaceholder('Escribe un mensaje…').fill('¡Qué buena noticia, gracias!');
      await page.getByPlaceholder('Escribe un mensaje…').press('Enter');
      await expect(page.getByText('¡Qué buena noticia, gracias!')).toBeVisible();

      const parent = await bearer(request, 'parent');
      const start = await request.post(`${API}/direct`, { headers: parent, data: { parentUserId: 'anyone' } });
      expect(start.status()).toBe(403);
    });
  });
});

test('a teacher cannot write to parents outside their courses and groups @BR-COM-003.8', async ({ request }) => {
  const teacher = await bearer(request, 'otherTeacher');
  // `otherTeacher` teaches the 8° course; Beto is in 7°.
  const recipients = (await (await request.get(`${API}/direct/recipients?q=Beto`, { headers: teacher })).json()) as unknown[];
  expect(recipients).toEqual([]);
});
