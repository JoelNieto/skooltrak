import { defineConfig } from 'orval';

/** Placeholder inputs — replace with real `/api/openapi.json` exports when available. */
export default defineConfig({
  'api-client-dashboard': {
    input: './libs/api-client-dashboard/openapi.json',
    output: {
      workspace: '.',
      target: './libs/api-client-dashboard/src/lib/generated/api.ts',
      schemas: './libs/api-client-dashboard/src/lib/generated/models',
      client: 'angular',
      httpClient: 'angular',
    },
  },
  'api-client-admin': {
    input: './libs/api-client-admin/openapi.json',
    output: {
      workspace: '.',
      target: './libs/api-client-admin/src/lib/generated/api.ts',
      schemas: './libs/api-client-admin/src/lib/generated/models',
      client: 'angular',
      httpClient: 'angular',
    },
  },
});
