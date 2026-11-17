import { config } from 'dotenv';
import { resolve } from 'path';

/** Ports for the isolated e2e stack — distinct from the dev stack (3000/4200). */
export const E2E_API_PORT = 3100;
export const E2E_WEB_PORT = 4300;

const E2E_DB_MARKER = 'e2e';

/**
 * Database for e2e runs. Uses E2E_DATABASE_URL when set; otherwise the dev DATABASE_URL from the
 * workspace `.env` with the database name replaced by `skooltrak-e2e`. The e2e run wipes this
 * database, so this refuses any URL whose database name does not contain "e2e".
 */
export function e2eDatabaseUrl(): string {
  config({ path: resolve(__dirname, '../../../.env'), quiet: true });

  let url = process.env['E2E_DATABASE_URL'];
  if (!url) {
    const devUrl = process.env['DATABASE_URL'];
    if (!devUrl) throw new Error('Set E2E_DATABASE_URL (or DATABASE_URL in .env) to run e2e tests.');
    const parsed = new URL(devUrl);
    parsed.pathname = '/skooltrak-e2e';
    url = parsed.toString();
  }

  assertE2eDatabase(url);
  return url;
}

export function assertE2eDatabase(url: string): void {
  const dbName = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
  if (!dbName.toLowerCase().includes(E2E_DB_MARKER)) {
    throw new Error(
      `Refusing to use database "${dbName}" for e2e: it will be wiped. Its name must contain "${E2E_DB_MARKER}".`,
    );
  }
}
