/**
 * Ensures OPENAPI_EXPORT is set before any Nest modules load (imports are hoisted in .ts).
 */
process.env.OPENAPI_EXPORT = 'true';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
await import('./generate-openapi-dashboard.ts');
