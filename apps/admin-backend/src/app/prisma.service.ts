import { PrismaClient } from '@generated/prisma';
import { Injectable, OnModuleInit } from '@nestjs/common';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // PrismaClient requires a non-empty options object
    // It will automatically read DATABASE_URL from process.env
    super({});
  }
  async onModuleInit() {
    await this.$connect();
  }
}
