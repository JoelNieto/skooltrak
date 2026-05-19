import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma.service';

interface JwtPayload {
  userId: string;
}

/** Resolves authenticated user id from a Socket.IO handshake (Bearer JWT). */
@Injectable()
export class ChatWsAuthService {
  private readonly logger = new Logger(ChatWsAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  resolveTokenFromHandshake(handshake: {
    auth?: Record<string, unknown>;
    headers?: Record<string, string | string[] | undefined>;
  }): string | null {
    const authToken = handshake.auth?.['token'];
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = handshake.headers?.['authorization'];
    const authHeader = Array.isArray(header) ? header[0] : header;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  async resolveUserIdFromToken(token: string | null): Promise<string | null> {
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, process.env['JWT_SECRET'] || '') as JwtPayload;
      if (!decoded?.userId) return null;

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true },
      });
      return user?.id ?? null;
    } catch (err) {
      this.logger.debug(`WebSocket auth failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
}
