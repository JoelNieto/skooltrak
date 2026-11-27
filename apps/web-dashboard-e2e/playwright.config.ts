import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { E2E_API_PORT, E2E_WEB_PORT, e2eDatabaseUrl } from './scripts/e2e-env';

/**
 * The e2e stack is isolated from the dev stack:
 * - API on :3100 and web on :4300 (dev uses :3000 / :4200), so a running dev server is never reused;
 * - the API talks to the e2e database (`skooltrak-e2e` by default), which `prepare-db` rebuilds
 *   and seeds before every run (`nx e2e web-dashboard-e2e` runs it first).
 * Set BASE_URL to test a deployed environment instead (no local servers are started then).
 */
const baseURL = process.env['BASE_URL'] || `http://localhost:${E2E_WEB_PORT}`;

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // Two servers, started outside `nx serve`: Nx shares a running continuous task across processes,
  // so going through `web-dashboard:serve` (which depends on `dashboard-backend:serve`) would wait on
  // a developer's running dev API (dev database) instead of starting the isolated one.
  webServer: process.env['BASE_URL']
    ? undefined
    : [
        {
          command: 'bun nx run dashboard-backend:build --tui=false && node dist/apps/dashboard-backend/main.js',
          url: `http://localhost:${E2E_API_PORT}/api`,
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 240_000,
          env: {
            // Not PORT: the Angular dev server would take it too and collide with the API.
            API_PORT: String(E2E_API_PORT),
            DATABASE_URL: e2eDatabaseUrl(),
          },
        },
        {
          command: 'bun nx run web-dashboard:serve:e2e --excludeTaskDependencies --tui=false',
          url: baseURL,
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 240_000,
        },
      ],
  projects: [
    // Logs every persona in once and saves its storage state (see src/auth.setup.ts).
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /\.after\.spec\.ts$/,
    },
    // Specs that add organization-wide data (e.g. ACA-001-S11 imports a student) run once every other
    // spec has finished, so the counts those specs assert (active students, group sizes) stay stable.
    // Name them `*.after.spec.ts`. Playwright skips this project when `chromium` has failures.
    {
      name: 'after',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['chromium'],
      testMatch: /\.after\.spec\.ts$/,
      testIgnore: [/assignment-channels\.after\.spec\.ts$/, /finance-(payments|checkout)\.after\.spec\.ts$/],
    },
    // COM-003-S02 creates assignment Q&A channels on the teacher's course, which the course page's
    // Canales tab counts (ACA-001 FR .29); it runs once `after` is done so those counts stay stable.
    {
      name: 'after-assignments',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['after'],
      testMatch: /assignment-channels\.after\.spec\.ts$/,
    },
    // FIN-001-S03 pays charges whose balances the FIN-001-S01/S02 specs assert, so it runs once
    // `after` is done.
    {
      name: 'after-finance',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['after'],
      testMatch: /finance-payments\.after\.spec\.ts$/,
    },
    // FIN-001-S04 continues S03's receipt numbers and pays the family's remaining charge.
    {
      name: 'after-checkout',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['after-finance'],
      testMatch: /finance-checkout\.after\.spec\.ts$/,
    },
  ],
});
