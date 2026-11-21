import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Builds the Swagger document served at `/api/openapi.json`. `main.ts` uses it both to serve the
 * spec and, with `OPENAPI_EXPORT=true`, to write it for `libs/api-client-admin`.
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Skooltrak Admin API')
    .setDescription('REST API for admin web client')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

/**
 * Writes the document to `OPENAPI_OUTPUT` (a path relative to the working directory). Used by the
 * `openapi` Nx target, which runs the built app without a database or a listening port.
 */
export function writeOpenApiDocument(document: OpenAPIObject): string {
  const output = process.env['OPENAPI_OUTPUT'];
  if (!output) {
    throw new Error('OPENAPI_OUTPUT must be set when OPENAPI_EXPORT=true');
  }
  const file = resolve(output);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return file;
}
