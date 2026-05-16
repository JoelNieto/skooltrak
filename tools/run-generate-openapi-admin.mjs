process.env.OPENAPI_EXPORT = 'true';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
await import('./generate-openapi-admin.ts');
