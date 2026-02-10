import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun ./prisma/scripts/seed-roles-permissions.ts && bun ./prisma/scripts/seed-admin.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
