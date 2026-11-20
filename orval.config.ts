import { defineConfig } from 'orval';

/**
 * Inputs are written by `nx run <dashboard|admin>-backend:openapi`, which also runs this config for
 * its project. Regenerate both with `bun run openapi`; see docs/api-clients.md.
 */
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
