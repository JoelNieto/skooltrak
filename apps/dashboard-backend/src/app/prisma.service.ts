import { PrismaClient } from '@generated/prisma';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env['DATABASE_URL'],
    });
    super({ adapter });
  }
  async onModuleInit() {
    // Skip DB when exporting OpenAPI (see tools/generate-openapi-*.ts)
    if (process.env['OPENAPI_EXPORT'] === 'true') {
      return;
    }
    await this.$connect();
  }
}
