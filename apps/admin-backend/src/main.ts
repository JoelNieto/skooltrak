/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { createOpenApiDocument, writeOpenApiDocument } from './openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for better-auth to handle raw request body
  });

  // Enable CORS - use CORS_ORIGINS env in production, localhost in development
  const corsOrigins = process.env['CORS_ORIGINS']
    ? process.env['CORS_ORIGINS'].split(',').map((o) => o.trim())
    : ['http://localhost:4200', 'http://localhost:4201'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const document = createOpenApiDocument(app);

  // `nx run <app>:openapi` sets OPENAPI_EXPORT: write the spec and exit before
  // the app initialises, so no database or port is needed.
  if (process.env['OPENAPI_EXPORT'] === 'true') {
    Logger.log(`📄 Wrote ${writeOpenApiDocument(document)}`);
    await app.close();
    process.exit(0);
  }

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',
    useGlobalPrefix: true,
  });

  const port = process.env.PORT || 5050;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📘 Swagger UI: http://localhost:${port}/${globalPrefix}/docs`);
  Logger.log(`📄 OpenAPI JSON: http://localhost:${port}/${globalPrefix}/openapi.json`);
}

bootstrap();
