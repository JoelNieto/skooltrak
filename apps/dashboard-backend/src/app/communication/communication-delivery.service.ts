import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeliveryChannel,
  DeliveryStatus,
  Prisma,
  UrgencyTier,
} from '@generated/prisma';
import { createHmac, timingSafeEqual } from 'crypto';
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

interface ChannelResolveOptions {
  urgency?: string | null;
  timezone?: string | null;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

/**
 * Owns fan-out orchestration and receipt reconciliation. Until Novu is deployed,
 * fan-out records deliveries and simulates dispatch. Quiet hours suppress
 * non-IN_APP channels unless the message is EMERGENCY. Swapping in real Novu
 * later means implementing `dispatchToNovu` only.
 */
@Injectable()
export class CommunicationDeliveryService {
  private readonly logger = new Logger(CommunicationDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Derive the set of delivery channels for a recipient given their preferences
   * and quiet-hours policy. Defaults: in-app + push + email.
   */
  resolveChannels(
    channelPrefs: Prisma.JsonValue | null | undefined,
    options: ChannelResolveOptions = {},
  ): DeliveryChannel[] {
    const prefs =
      channelPrefs && typeof channelPrefs === 'object'
        ? (channelPrefs as Record<string, unknown>)
        : {};
    const channels = DEFAULT_DELIVERY_CHANNELS.filter((channel) => {
      if (channel === DeliveryChannel.PUSH) return prefs['push'] !== false;
      if (channel === DeliveryChannel.EMAIL) return prefs['email'] !== false;
      return true;
    });
    if (prefs['sms'] === true) channels.push(DeliveryChannel.SMS);
    if (prefs['voice'] === true) channels.push(DeliveryChannel.VOICE);

    if (options.urgency === UrgencyTier.EMERGENCY) {
      return channels;
    }
    if (
      this.isInQuietHours(
        options.timezone,
        options.quietHoursStart,
        options.quietHoursEnd,
      )
    ) {
      return channels.filter((channel) => channel === DeliveryChannel.IN_APP);
    }
    return channels;
  }

  isInQuietHours(
    timezone?: string | null,
    start?: string | null,
    end?: string | null,
  ): boolean {
    if (!start || !end) return false;
    const nowMinutes = this.localMinutes(timezone || 'UTC');
    const startMinutes = this.parseHhMm(start);
    const endMinutes = this.parseHhMm(end);
    if (startMinutes == null || endMinutes == null || startMinutes === endMinutes) {
      return false;
    }
    if (startMinutes < endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
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
    const prefByUser = new Map(prefs.map((p) => [p.userId, p]));

    return participants.map((p) => {
      const pref = prefByUser.get(p.userId);
      return {
        userId: p.userId,
        channels: this.resolveChannels(pref?.channelPrefs ?? null, {
          urgency: input.urgency,
          timezone: pref?.timezone,
          quietHoursStart: pref?.quietHoursStart,
          quietHoursEnd: pref?.quietHoursEnd,
        }),
      };
    });
  }

  /**
   * Create a delivery row per recipient per channel for a message. Returns the
   * created rows so the caller can dispatch.
   */
  async materializeDeliveries(messageId: string, recipientUserIds: string[]) {
    const message = await this.prisma.communicationMessage.findUnique({
      where: { id: messageId },
      select: { urgency: true },
    });
    const prefs = await this.prisma.recipientPreference.findMany({
      where: { userId: { in: recipientUserIds } },
    });
    const prefByUser = new Map(prefs.map((p) => [p.userId, p]));

    const rows: Prisma.MessageDeliveryCreateManyInput[] = [];
    for (const userId of recipientUserIds) {
      const pref = prefByUser.get(userId);
      const channels = this.resolveChannels(pref?.channelPrefs ?? null, {
        urgency: message?.urgency,
        timezone: pref?.timezone,
        quietHoursStart: pref?.quietHoursStart,
        quietHoursEnd: pref?.quietHoursEnd,
      });
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

    // Each delivery row maps to a distinct Novu event, so stamp a unique
    // synthetic event id per row. `updateMany` can't vary the value per row,
    // and `novuEventId` is unique — updating many rows to one value would fail.
    await this.prisma.$transaction(
      pending.map((delivery) =>
        this.prisma.messageDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.SENT,
            deliveredAt: new Date(),
            novuEventId: `stub-${messageId}-${delivery.id}`,
          },
        }),
      ),
    );

    this.logger.debug(`Fan-out dispatched ${pending.length} delivery rows for message ${messageId}`);
  }

  assertWebhookSignature(signature: string | undefined, payload: unknown): void {
    const secret = this.config.get<string>('NOVU_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Novu webhook is not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('Missing Novu webhook signature');
    }
    const expected = createHmac('sha256', secret).update(JSON.stringify(payload ?? {})).digest('hex');
    const provided = signature.replace(/^sha256=/i, '').trim();
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(provided, 'utf8');
    if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
      throw new UnauthorizedException('Invalid Novu webhook signature');
    }
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
      if (!payload.messageId || !payload.recipientUserId) {
        const existing = await this.prisma.messageDelivery.findUnique({
          where: { novuEventId: payload.novuEventId },
          select: { id: true },
        });
        if (!existing) {
          throw new BadRequestException('Webhook create requires messageId and recipientUserId');
        }
        await this.prisma.messageDelivery.update({
          where: { novuEventId: payload.novuEventId },
          data,
        });
        return;
      }
      await this.prisma.messageDelivery.upsert({
        where: { novuEventId: payload.novuEventId },
        update: data,
        create: {
          messageId: payload.messageId,
          recipientUserId: payload.recipientUserId,
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

    if (!payload.messageId || !payload.recipientUserId) {
      throw new BadRequestException('Webhook must carry messageId and recipientUserId');
    }

    await this.prisma.messageDelivery.updateMany({
      where: {
        messageId: payload.messageId,
        recipientUserId: payload.recipientUserId,
        channel,
      },
      data,
    });
  }

  private localMinutes(timeZone: string): number {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date());
      const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
      const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
      return hour * 60 + minute;
    } catch {
      const now = new Date();
      return now.getUTCHours() * 60 + now.getUTCMinutes();
    }
  }

  private parseHhMm(value: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return null;
    return hour * 60 + minute;
  }
}
