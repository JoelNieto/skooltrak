import { PrismaClient } from '@generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleInit } from '@nestjs/common';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env['DATABASE_URL']!,
    });
    super({ adapter });
  }
  async onModuleInit() {
    if (process.env['OPENAPI_EXPORT'] === 'true') {
      return;
    }
    await this.$connect();
  }
}
