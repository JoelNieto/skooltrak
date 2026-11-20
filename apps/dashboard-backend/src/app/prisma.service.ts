import { PrismaClient } from '@generated/prisma';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Fields no query returns unless it asks for them (`select` them, or `omit: { field: false }`).
 * A student's enrollment code lets a new account link itself as that child's parent, so it must
 * never ride along in an `include: { student: true }`. Only admins read it, through
 * `StudentsService` (`MANAGE_STUDENTS`).
 *
 * Applied at runtime only: typing the client with it would ripple through every helper that takes
 * a plain `PrismaClient`. Result types therefore still list these fields; treat them as absent
 * unless the query selected them.
 */
export const OMITTED_BY_DEFAULT = {
  student: { enrollmentCode: true, enrollmentCodeGeneratedAt: true },
} as const;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env['DATABASE_URL'],
    });
    super({ adapter, omit: OMITTED_BY_DEFAULT });
  }
  async onModuleInit() {
    // Skip DB when exporting OpenAPI (see tools/generate-openapi-*.ts)
    if (process.env['OPENAPI_EXPORT'] === 'true') {
      return;
    }
    await this.$connect();
  }
}
