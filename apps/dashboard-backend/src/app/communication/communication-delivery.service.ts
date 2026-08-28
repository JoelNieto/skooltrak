import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  DeliveryChannel,
  DeliveryStatus,
  Prisma,
} from '@generated/prisma';
import { PrismaService } from '../prisma.service';
import { DEFAULT_DELIVERY_CHANNELS } from './dto/communication.input';

interface NovuWebhookPayload {
  novuEventId?: string;
  messageId?: string;
  recipientUserId?: string;
  channel?: DeliveryChannel;
  status?: DeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
}

/**
 * Owns fan-out orchestration and receipt reconciliation. In Phase 0 the Novu
 * integration is a seam: fan-out records deliveries and simulates dispatch, and
 * the webhook handler performs idempotent upserts on `novuEventId`. Swapping in
 * real Novu later means implementing `dispatchToNovu` only.
 */
@Injectable()
export class CommunicationDeliveryService {
  private readonly logger = new Logger(CommunicationDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Derive the set of delivery channels for a recipient given their preferences.
   * Quiet-hours / emergency bypass is applied by the caller when constructing
   * the urgency tiers (Phase 1/2). Defaults: in-app + push + email.
   */
  resolveChannels(channelPrefs: Prisma.JsonValue | null | undefined): DeliveryChannel[] {
    const prefs =
      channelPrefs && typeof channelPrefs === 'object'
        ? (channelPrefs as Record<string, unknown>)
        : {};
    const channels = [...DEFAULT_DELIVERY_CHANNELS];
    if (prefs['sms'] === true) channels.push(DeliveryChannel.SMS);
    if (prefs['voice'] === true) channels.push(DeliveryChannel.VOICE);
    return channels;
  }

  async preview(input: {
    threadId: string;
    body: string;
    urgency?: string;
  }): Promise<{ userId: string; channels: DeliveryChannel[] }[]> {
    const participants = await this.prisma.threadParticipant.findMany({
      where: { threadId: input.threadId },
      select: { userId: true },
    });

    const prefs = await this.prisma.recipientPreference.findMany({
      where: { userId: { in: participants.map((p) => p.userId) } },
    });
    const prefByUser = new Map(prefs.map((p) => [p.userId, p.channelPrefs]));

    return participants.map((p) => ({
      userId: p.userId,
      channels: this.resolveChannels(prefByUser.get(p.userId) ?? null),
    }));
  }

  /**
   * Create a delivery row per recipient per channel for a message. Returns the
   * created rows so the caller can dispatch.
   */
  async materializeDeliveries(messageId: string, recipientUserIds: string[]) {
    const prefs = await this.prisma.recipientPreference.findMany({
      where: { userId: { in: recipientUserIds } },
    });
    const prefByUser = new Map(prefs.map((p) => [p.userId, p.channelPrefs]));

    const rows: Prisma.MessageDeliveryCreateManyInput[] = [];
    for (const userId of recipientUserIds) {
      const channels = this.resolveChannels(prefByUser.get(userId) ?? null);
      for (const channel of channels) {
        rows.push({
          messageId,
          recipientUserId: userId,
          channel,
          status: DeliveryStatus.PENDING,
        });
      }
    }

    if (rows.length === 0) return [];
    return this.prisma.messageDelivery.createManyAndReturn({ data: rows });
  }

  /**
   * Fan-out stub. Dispatches the already-materialized deliveries. With real Novu
   * this would call the Novu API per channel; here we mark them SENT and stamp a
   * synthetic event id so the webhook reconciliation path is exercised.
   */
  async fanOut(messageId: string): Promise<void> {
    const pending = await this.prisma.messageDelivery.findMany({
      where: { messageId, status: DeliveryStatus.PENDING },
    });
    if (pending.length === 0) return;

    await this.prisma.messageDelivery.updateMany({
      where: { messageId, status: DeliveryStatus.PENDING },
      data: {
        status: DeliveryStatus.SENT,
        deliveredAt: new Date(),
        novuEventId: `stub-${messageId}-${Date.now()}`,
      },
    });

    this.logger.debug(`Fan-out dispatched ${pending.length} delivery rows for message ${messageId}`);
  }

  /**
   * Idempotent webhook reconciliation. Upserts on `novuEventId`; falls back to
   * (messageId, recipientUserId, channel) when no event id is provided.
   */
  async reconcileWebhook(payload: NovuWebhookPayload): Promise<void> {
    const channel = payload.channel ?? DeliveryChannel.IN_APP;
    if (!payload.novuEventId && (!payload.messageId || !payload.recipientUserId)) {
      throw new BadRequestException('Webhook must carry novuEventId or messageId+recipientUserId');
    }

    const data: Prisma.MessageDeliveryUpdateInput = {};
    if (payload.status) data.status = payload.status;
    if (payload.deliveredAt) data.deliveredAt = new Date(payload.deliveredAt);
    if (payload.readAt) data.readAt = new Date(payload.readAt);
    if (payload.failureReason) data.failureReason = payload.failureReason;
    if (payload.novuEventId) data.novuEventId = payload.novuEventId;

    if (payload.novuEventId) {
      await this.prisma.messageDelivery.upsert({
        where: { novuEventId: payload.novuEventId },
        update: data,
        create: {
          messageId: payload.messageId!,
          recipientUserId: payload.recipientUserId!,
          channel,
          status: payload.status ?? DeliveryStatus.PENDING,
          novuEventId: payload.novuEventId,
          deliveredAt: payload.deliveredAt ? new Date(payload.deliveredAt) : null,
          readAt: payload.readAt ? new Date(payload.readAt) : null,
          failureReason: payload.failureReason,
        },
      });
      return;
    }

    await this.prisma.messageDelivery.updateMany({
      where: {
        messageId: payload.messageId!,
        recipientUserId: payload.recipientUserId!,
        channel,
      },
      data,
    });
  }
}
