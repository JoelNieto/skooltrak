import { expect, test } from '@playwright/test';
import { E2E_PASSWORD, PersonaKey, personas, storageStatePath } from './support/fixtures';

/**
 * Logs every seeded persona in through the API and stores the access token the app reads from
 * localStorage, so specs can start authenticated via `test.use({ storageState: ... })`.
 *
 * Login only succeeds against the seeded e2e database, so this also fails fast if the stack is
 * accidentally pointed at another database.
 */
for (const key of Object.keys(personas) as PersonaKey[]) {
  test(`authenticate ${key}`, async ({ page, request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: { email: personas[key].email, password: E2E_PASSWORD },
    });
    expect(response.ok(), `login failed for ${personas[key].email} — is the e2e database seeded?`).toBeTruthy();
    const { accessToken } = (await response.json()) as { accessToken: string };

    await page.goto('/login');
    await page.evaluate((token) => localStorage.setItem('access_token', token), accessToken);
    await page.context().storageState({ path: storageStatePath(key) });
  });
}
