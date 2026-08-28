import { DeliveryChannel, ThreadType, UrgencyTier } from '@generated/prisma';

export class CreateThreadInput {
  type: ThreadType;

  title: string;

  scopeId?: string | null;

  urgencyDefault?: UrgencyTier;

  participantUserIds?: string[];
}

export class SendMessageInput {
  threadId: string;

  body: string;

  urgency?: UrgencyTier;

  replyToId?: string | null;
}

export class AddParticipantInput {
  threadId: string;

  userIds: string[];
}

export class SubscriberSyncInput {
  userId: string;

  channelPrefs?: Record<string, boolean> | null;

  language?: string | null;

  timezone?: string | null;

  quietHoursStart?: string | null;

  quietHoursEnd?: string | null;
}

export class DeliveryPreviewInput {
  threadId: string;

  body: string;

  urgency?: UrgencyTier;
}

export class PreferenceInput {
  language?: string | null;

  timezone?: string | null;

  quietHoursStart?: string | null;

  quietHoursEnd?: string | null;

  channelPrefs?: Record<string, boolean> | null;
}

export class BroadcastInput {
  type: ThreadType;

  title: string;

  body: string;

  scopeId?: string | null;

  urgency?: UrgencyTier;
}

export const DEFAULT_DELIVERY_CHANNELS: DeliveryChannel[] = [
  DeliveryChannel.IN_APP,
  DeliveryChannel.PUSH,
  DeliveryChannel.EMAIL,
];
