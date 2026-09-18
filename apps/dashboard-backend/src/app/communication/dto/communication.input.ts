import { DeliveryChannel, ThreadType, UrgencyTier } from '@generated/prisma';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateThreadInput {
  @IsEnum(ThreadType)
  type: ThreadType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  scopeId?: string | null;

  @IsOptional()
  @IsEnum(UrgencyTier)
  urgencyDefault?: UrgencyTier;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantUserIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  body?: string | null;
}

export class SendMessageInput {
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  body: string;

  @IsOptional()
  @IsEnum(UrgencyTier)
  urgency?: UrgencyTier;

  @IsOptional()
  @IsString()
  replyToId?: string | null;
}

/** Body for POST /threads/:id/messages — threadId comes from the route. */
export class SendMessageBodyInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  body: string;

  @IsOptional()
  @IsEnum(UrgencyTier)
  urgency?: UrgencyTier;

  @IsOptional()
  @IsString()
  replyToId?: string | null;
}

export class AddParticipantInput {
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];
}

export class AddParticipantBodyInput {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];
}

export class SubscriberSyncInput {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsObject()
  channelPrefs?: Record<string, boolean> | null;

  @IsOptional()
  @IsString()
  language?: string | null;

  @IsOptional()
  @IsString()
  timezone?: string | null;

  @IsOptional()
  @IsString()
  quietHoursStart?: string | null;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string | null;
}

export class DeliveryPreviewInput {
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsEnum(UrgencyTier)
  urgency?: UrgencyTier;
}

export class PreferenceInput {
  @IsOptional()
  @IsString()
  language?: string | null;

  @IsOptional()
  @IsString()
  timezone?: string | null;

  @IsOptional()
  @IsString()
  quietHoursStart?: string | null;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string | null;

  @IsOptional()
  @IsObject()
  channelPrefs?: Record<string, boolean> | null;
}

export class BroadcastInput {
  @IsIn([ThreadType.CLASS_GROUP, ThreadType.SCHOOL_WIDE, ThreadType.COURSE])
  type: ThreadType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  body: string;

  @IsOptional()
  @IsString()
  scopeId?: string | null;

  @IsOptional()
  @IsEnum(UrgencyTier)
  urgency?: UrgencyTier;

  @IsOptional()
  @IsBoolean()
  repliesAllowed?: boolean;
}

export class UpdateBroadcastInput {
  @IsOptional()
  @IsBoolean()
  repliesAllowed?: boolean;
}

export const DEFAULT_DELIVERY_CHANNELS: DeliveryChannel[] = [
  DeliveryChannel.IN_APP,
  DeliveryChannel.PUSH,
  DeliveryChannel.EMAIL,
];
