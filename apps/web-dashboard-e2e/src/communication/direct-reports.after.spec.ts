import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * COM-003-S04: a participant reports a direct conversation; the organization's admins then read it
 * read-only, every opening is logged, and they resolve the report (FR .20, BR .14).
 * docs/product/slices/COM-003-S04-report-direct.md
 *
 * The teacher writes to Paula (`parent`) about Ana here; `direct.after.spec.ts` uses Beto, so the two
 * never share a conversation. An `after` spec, like the other direct-message one.
 */
test.describe.configure({ mode: 'serial' });

const API = '/api/v1/communication';
const MESSAGE = 'Ana no entregó la tarea hoy. (S04)';
const REASON = 'El tono del mensaje no me pareció adecuado. (S04)';
const RESOLUTION = 'Hablé con el docente y con la familia. (S04)';

type Headers = Record<string, string>;
let conversationId: string;

async function bearer(request: APIRequestContext, persona: keyof typeof personas): Promise<Headers> {
  const res = await request.post('/api/v1/auth/login', {
    data: { email: personas[persona].email, password: E2E_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.beforeAll(async ({ request }) => {
  const teacher = await bearer(request, 'teacher');
  const ana = data.relatedStudents[0];
  const recipients = (await (
    await request.get(`${API}/direct/recipients`, { headers: teacher, params: { q: ana } })
  ).json()) as {
    student: { id: string; name: string };
    parents: { id: string; name: string }[];
  }[];
  const target = recipients.find((r) => r.student.name.startsWith(ana) && r.parents.length);
  expect(target, 'Ana and her guardian').toBeTruthy();
  const res = await request.post(`${API}/direct`, {
    headers: teacher,
    data: { parentUserId: target?.parents[0].id, studentId: target?.student.id, body: MESSAGE },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  conversationId = ((await res.json()) as { id: string }).id;
});

test('before any report, admins cannot open the conversation @BR-COM-003.9 @BR-COM-003.14', async ({ request }) => {
  const admin = await bearer(request, 'admin');
  expect(
    (await request.get(`${API}/direct/reports/conversations/${conversationId}`, { headers: admin })).status(),
  ).toBe(404);
});

test.describe('as the parent', () => {
  test.use({ storageState: storageStatePath('parent') });

  test('reports the conversation @FR-COM-003.20', async ({ page }) => {
    await page.goto(`/communication/direct/${conversationId}`);
    await expect(page.getByRole('paragraph').filter({ hasText: MESSAGE })).toBeVisible();
    await page.getByRole('button', { name: 'Reportar conversación' }).click();
    await page.getByRole('textbox', { name: 'Motivo del reporte' }).fill(REASON);
    await page.getByRole('button', { name: 'Enviar reporte' }).click();
    // exact: the success toast reads "Conversación reportada".
    await expect(page.getByText('Reportada', { exact: true })).toBeVisible();
  });
});

test('only participants report, and only admins review @BR-COM-003.14', async ({ request }) => {
  // BR .9: another teacher doesn't learn the conversation exists.
  const other = await bearer(request, 'otherTeacher');
  expect(
    (await request.post(`${API}/direct/${conversationId}/report`, { headers: other, data: { reason: 'x' } })).status(),
  ).toBe(404);
  const teacher = await bearer(request, 'teacher');
  expect((await request.get(`${API}/direct/reports`, { headers: teacher })).status()).toBe(403);
  expect(
    (await request.get(`${API}/direct/reports/conversations/${conversationId}`, { headers: teacher })).status(),
  ).toBe(403);
});

test.describe('as an admin', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('reads the reported conversation read-only, and the access is logged @FR-COM-003.20 @BR-COM-003.14', async ({
    page,
  }) => {
    await page.goto('/communication/direct-reports');
    const row = page.getByRole('list', { name: 'Reportes' }).getByRole('link').filter({ hasText: REASON });
    await expect(row).toContainText('Abierto');
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/communication/direct-reports/${conversationId}$`));

    const review = page.getByRole('region', { name: 'Conversación reportada' });
    await expect(review.getByRole('paragraph').filter({ hasText: MESSAGE })).toBeVisible();
    await expect(review).toContainText('Solo lectura');
    await expect(page.getByRole('textbox', { name: 'Escribe un mensaje…' })).toHaveCount(0);
    await expect(
      review.getByRole('region', { name: 'Accesos registrados' }).getByRole('listitem').first(),
    ).toContainText(personas.admin.firstName);
  });

  test('resolves the report; the conversation is private again @FR-COM-003.20 @BR-COM-003.14', async ({
    page,
    request,
  }) => {
    await page.goto(`/communication/direct-reports/${conversationId}`);
    const review = page.getByRole('region', { name: 'Conversación reportada' });
    await review.getByRole('textbox', { name: 'Cómo se resolvió' }).fill(RESOLUTION);
    await review.getByRole('button', { name: 'Resolver reporte' }).click();
    await expect(
      page.getByRole('list', { name: 'Reportes' }).getByRole('link').filter({ hasText: REASON }),
    ).toContainText('Resuelto');

    // With no open report, admins can't open it any more (BR .14), and a resolved report stays resolved.
    const admin = await bearer(request, 'admin');
    expect(
      (await request.get(`${API}/direct/reports/conversations/${conversationId}`, { headers: admin })).status(),
    ).toBe(404);
    const reports = (await (await request.get(`${API}/direct/reports`, { headers: admin })).json()) as {
      id: string;
      reason: string;
      resolution: string | null;
    }[];
    const report = reports.find((r) => r.reason === REASON);
    expect(report?.resolution).toBe(RESOLUTION);
    expect(
      (
        await request.post(`${API}/direct/reports/${report?.id}/resolve`, {
          headers: admin,
          data: { resolution: 'otra vez' },
        })
      ).status(),
    ).toBe(400);
  });
});
