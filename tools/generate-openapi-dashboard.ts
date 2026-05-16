/**
 * Writes libs/api-client-dashboard/openapi.json from the live Swagger document.
 * Run: bun tools/run-generate-openapi-dashboard.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function main() {
  const { AppModule } = await import(
    '../apps/dashboard-backend/src/app/app.module.js'
  ).catch(() =>
    import('../apps/dashboard-backend/src/app/app.module.ts'),
  );

  Logger.overrideLogger(false);
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: false,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Skooltrak Dashboard API')
    .setDescription('REST API for dashboard, shell, and store clients')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  const outDir = join(__dirname, '../libs/api-client-dashboard');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'openapi.json');
  writeFileSync(outFile, JSON.stringify(document, null, 2), 'utf8');
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
