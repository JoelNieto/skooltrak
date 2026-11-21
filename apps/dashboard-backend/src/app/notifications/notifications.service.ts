import { AuthUserContext } from '@/auth';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationList } from './entities/notification.entity';

const MAX_TAKE = 50;

/** The caller's own in-app notifications (ASM-001-S08). Nobody reads or changes another user's. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    user: AuthUserContext | undefined,
    query: { unread?: boolean; type?: string; take?: number },
  ): Promise<NotificationList> {
    const recipientId = requireUser(user);
    const take = Math.min(Math.max(query.take ?? MAX_TAKE, 1), MAX_TAKE);
    const [rows, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId, ...(query.unread ? { read: false } : {}), ...(query.type ? { type: query.type } : {}) },
        orderBy: { createdAt: 'desc' },
        take,
        select: { id: true, type: true, title: true, message: true, read: true, relatedId: true, createdAt: true },
      }),
      this.prisma.notification.count({ where: { recipientId, read: false } }),
    ]);
    return { notifications: rows.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })), unread };
  }

  /** Marks one of the caller's notifications read; someone else's id changes nothing. */
  async markRead(user: AuthUserContext | undefined, id: string): Promise<{ updated: number }> {
    const recipientId = requireUser(user);
    const { count } = await this.prisma.notification.updateMany({ where: { id, recipientId }, data: { read: true } });
    return { updated: count };
  }

  async markAllRead(user: AuthUserContext | undefined): Promise<{ updated: number }> {
    const recipientId = requireUser(user);
    const { count } = await this.prisma.notification.updateMany({ where: { recipientId, read: false }, data: { read: true } });
    return { updated: count };
  }
}

function requireUser(user: AuthUserContext | undefined): string {
  if (!user?.userId) throw new ForbiddenException('Not authenticated');
  return user.userId;
}
