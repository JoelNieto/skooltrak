import { PrismaClient } from '@generated/prisma';
import { Injectable, OnModuleInit } from '@nestjs/common';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }
  async onModuleInit() {
    await this.$connect();
  }
}
