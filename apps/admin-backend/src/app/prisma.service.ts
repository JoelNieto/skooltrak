import { PrismaClient } from '@generated/prisma';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // PrismaClient requires a non-empty options object
    // It will automatically read DATABASE_URL from process.env
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
