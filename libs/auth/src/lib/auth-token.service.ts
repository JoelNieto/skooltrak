import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from './prisma.service';
import { RateLimiter } from './rate-limiter';
import type { AuthTokenType, Prisma } from '@generated/prisma';

const TOKEN_REDEEM_LIMIT = 10;
const TOKEN_REDEEM_WINDOW_MS = 15 * 60 * 1000;

export interface IssueTokenParams {
  type: AuthTokenType;
  ttlMs: number;
  userId?: string;
  studentId?: string;
  organizationId?: string;
  metadata?: Prisma.InputJsonValue;
  createdById?: string;
}

@Injectable()
export class AuthTokenService {
  private readonly rateLimiter = new RateLimiter();

  constructor(private prisma: PrismaService) {}

  private static hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** Issue a single-use token. Returns the raw token (shown only once). */
  async issue(params: IssueTokenParams): Promise<{ raw: string; expiresAt: Date }> {
    const raw = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + params.ttlMs);
    await this.prisma.authToken.create({
      data: {
        type: params.type,
        tokenHash: AuthTokenService.hash(raw),
        userId: params.userId ?? null,
        studentId: params.studentId ?? null,
        organizationId: params.organizationId ?? null,
        metadata: params.metadata ?? undefined,
        expiresAt,
        createdById: params.createdById ?? null,
      },
    });
    return { raw, expiresAt };
  }

  /**
   * Redeem a single-use token. Atomically marks it consumed so it cannot be
   * used twice. Returns the stored record, or null if not found / already
   * consumed / expired. Never reveals which condition failed.
   */
  async redeem(opts: {
    type: AuthTokenType;
    raw: string;
    ip?: string;
    actorId?: string;
  }): Promise<{ userId: string | null; studentId: string | null; organizationId: string | null; metadata: Prisma.JsonValue | null } | null> {
    const tokenHash = AuthTokenService.hash(opts.raw);

    const result = await this.prisma.authToken.updateMany({
      where: {
        type: opts.type,
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        consumedAt: new Date(),
        consumedByUserId: opts.actorId ?? null,
        attempts: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return null;
    }

    const token = await this.prisma.authToken.findUniqueOrThrow({
      where: { tokenHash },
    });

    return {
      userId: token.userId,
      studentId: token.studentId,
      organizationId: token.organizationId,
      metadata: token.metadata,
    };
  }

  /** Invalidate any unconsumed tokens of a type for a student/user (rotation). */
  async revokeFor(opts: { type: AuthTokenType; studentId?: string; userId?: string }): Promise<number> {
    const result = await this.prisma.authToken.updateMany({
      where: {
        type: opts.type,
        consumedAt: null,
        OR: [
          opts.studentId ? { studentId: opts.studentId } : {},
          opts.userId ? { userId: opts.userId } : {},
        ],
      },
      data: { consumedAt: new Date() },
    });
    return result.count;
  }

  /** Rate-limit an unauthenticated token surface (issue/redeem) per IP. */
  hitRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
    return this.rateLimiter.hit(key, TOKEN_REDEEM_LIMIT, TOKEN_REDEEM_WINDOW_MS);
  }

  /** Delete consumed/expired tokens older than the given retention window. */
  async purge(olderThanDays = 30): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.authToken.deleteMany({
      where: {
        OR: [{ consumedAt: { lt: cutoff } }, { expiresAt: { lt: cutoff } }],
      },
    });
    return result.count;
  }
}
