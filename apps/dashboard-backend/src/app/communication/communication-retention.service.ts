import { Injectable, Logger } from '@nestjs/common';
import { ThreadStatus } from '@generated/prisma';
import { PrismaService } from '../prisma.service';

/**
 * Right-to-erasure / minor-data retention for the communication domain.
 * Mirrors the legacy chat-retention concept but operates on the unified store.
 */
@Injectable()
export class CommunicationRetentionService {
  private readonly logger = new Logger(CommunicationRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async softDeleteMessage(messageId: string, actorId: string) {
    await this.prisma.communicationMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
    await this.audit(actorId, 'MESSAGE_DELETED', { messageId });
  }

  async softDeleteThread(threadId: string, actorId: string) {
    await this.prisma.communicationThread.update({
      where: { id: threadId },
      data: { deletedAt: new Date(), status: ThreadStatus.ARCHIVED },
    });
    await this.audit(actorId, 'THREAD_DELETED', { threadId });
  }

  /** Erase all communication data tied to a user (GDPR / right to erasure). */
  async eraseUser(userId: string) {
    await this.prisma.messageDelivery.deleteMany({ where: { recipientUserId: userId } });
    await this.prisma.threadParticipant.deleteMany({ where: { userId } });
    await this.prisma.recipientPreference.delete({ where: { userId } }).catch(() => undefined);
    this.logger.log(`Erased communication data for user ${userId}`);
  }

  private async audit(actorId: string, action: string, detail: Record<string, unknown>) {
    await this.prisma.communicationAuditLog
      .create({
        data: { actorId, action, detail: JSON.stringify(detail) },
      })
      .catch((err) => this.logger.warn(`Audit failed: ${err}`));
  }
}
