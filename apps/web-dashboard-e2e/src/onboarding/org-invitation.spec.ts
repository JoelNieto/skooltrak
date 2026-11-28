import { APIRequestContext, expect, request as playwrightRequest, test } from '@playwright/test';
import { E2E_API_PORT } from '../../scripts/e2e-env';
import { data, E2E_PASSWORD, personas } from '../support/fixtures';

/**
 * IAM-001-S01 — create an organization with its admin invitation, accept it with a new account,
 * and create the organization's first school.
 * docs/product/slices/IAM-001-S01-create-and-accept-invitation.md
 *
 * Fixtures: `data.orgInvitation` (an invited organization with a valid and an expired link, and a
 * SYSADMIN user). The console (web-admin) has no e2e harness yet, so its endpoints are exercised at
 * the API level against the e2e API, which serves the same `libs/auth` controllers.
 */
const fx = data.orgInvitation;

async function api(token?: string): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: `http://localhost:${E2E_API_PORT}`,
    extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function login(email: string): Promise<string> {
  const ctx = await api();
  const res = await ctx.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  const { accessToken } = await res.json();
  await ctx.dispose();
  return accessToken;
}

test.describe('Console: create organization with admin invitation', () => {
  test('a platform admin creates an empty organization and its pending invitation @FR-IAM-001.1 @FR-IAM-001.2', async () => {
    const ctx = await api(await login(fx.sysadmin.email));
    const res = await ctx.post('/api/v1/organizations/with-invitation', {
      data: {
        name: 'Academia Consola E2E',
        description: 'Creada desde la consola',
        admin: { firstName: 'Ana', lastName: 'Castillo', email: 'Consola.E2E@skooltrak.test' },
      },
    });
    expect(res.status()).toBe(201);
    const created = await res.json();
    expect(created.invitation).toMatchObject({ email: 'consola.e2e@skooltrak.test', state: 'VALID' });

    const list = await (await ctx.get('/api/v1/organizations')).json();
    const row = list.find((o: { id: string }) => o.id === created.organizationId);
    expect(row).toMatchObject({ onboardingCompleted: false, adminInvitation: { email: 'consola.e2e@skooltrak.test', state: 'VALID' } });

    await ctx.dispose();
  });

  test('a school admin cannot create organizations @FR-IAM-001.1', async () => {
    const ctx = await api(await login(personas.admin.email));
    const res = await ctx.post('/api/v1/organizations/with-invitation', {
      data: { name: 'No permitida', admin: { firstName: 'X', lastName: 'Y', email: 'x.e2e@skooltrak.test' } },
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });
});

test.describe('Invitee accepts and sets up the first school', () => {
  test.describe.configure({ mode: 'serial' });

  test('an expired link shows no form and refuses acceptance @FR-IAM-001.12', async ({ page }) => {
    await page.goto(`/invitacion/${fx.expiredToken}`);
    await expect(page.getByRole('heading', { name: 'Este enlace ya no es válido' })).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toHaveCount(0);

    const ctx = await api();
    const res = await ctx.post(`/api/v1/auth/org-invitations/${fx.expiredToken}/accept`, {
      data: { firstName: 'Vera', lastName: 'Vencida', password: 'secreto123', acceptTerms: true },
    });
    expect(res.status()).toBe(410);
    expect(await res.json()).toMatchObject({ state: 'EXPIRED' });
    await ctx.dispose();
  });

  test('creates the account from the link and lands in the wizard @FR-IAM-001.11 @FR-IAM-001.12 @FR-IAM-001.15', async ({ page }) => {
    await page.goto(`/invitacion/${fx.validToken}`);
    await expect(page.getByRole('heading', { name: `Te damos la bienvenida a ${fx.organization}` })).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toHaveValue(fx.invitee.email);
    await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('readonly', '');
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(fx.invitee.firstName);
    await expect(page.getByLabel('Apellido')).toHaveValue(fx.invitee.lastName);

    await page.getByLabel('Contraseña').fill('Invitada-2026!');
    await page.getByLabel(/Acepto los términos/).check();
    await page.getByRole('button', { name: 'Crear cuenta y continuar' }).click();

    await expect(page).toHaveURL(/\/onboarding\/setup/);
    await expect(page.getByRole('heading', { name: 'Tu primera escuela' })).toBeVisible();
    // Prefilled with the organization name.
    await expect(page.getByLabel('Nombre de la escuela')).toHaveValue(fx.organization);

    await page.getByLabel('Nombre de la escuela').fill(fx.school.name);
    await page.getByLabel('Nombre corto o siglas').fill(fx.school.shortName);
    await page.getByRole('button', { name: 'Crear escuela y continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Crea tu Primer Nivel Académico' })).toBeVisible();

    // The school belongs to the invited organization; a second "first school" is refused.
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const ctx = await api(token ?? undefined);
    const schools = await (await ctx.get('/api/v1/schools')).json();
    expect(schools.map((s: { name: string }) => s.name)).toEqual([fx.school.name]);
    const again = await ctx.post('/api/v1/auth/setup/first-school', { data: { name: 'Otra', shortName: 'OTR' } });
    expect(again.status()).toBe(409);
    await ctx.dispose();
  });

  test('the accepted link can no longer be used @FR-IAM-001.12', async ({ page }) => {
    await page.goto(`/invitacion/${fx.validToken}`);
    await expect(page.getByRole('heading', { name: 'Ya aceptaste esta invitación' })).toBeVisible();

    const ctx = await api(await login(fx.sysadmin.email));
    const list = await (await ctx.get('/api/v1/organizations')).json();
    const row = list.find((o: { name: string }) => o.name === fx.organization);
    expect(row.adminInvitation).toMatchObject({ email: fx.invitee.email, state: 'ACCEPTED' });
    await ctx.dispose();
  });
});
