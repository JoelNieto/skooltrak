import { ChannelReplyVisibilityKey, CREATABLE_CHANNEL_SCOPES, CreatableChannelScopeKey } from '@/shared';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const VISIBILITIES: ChannelReplyVisibilityKey[] = ['PUBLIC', 'PRIVATE'];

/** `PATCH /v1/communication/channels/:id` (FR-COM-003.5). Fields left out stay as they are. */
export class UpdateChannelInput {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  audienceStudents?: boolean;

  @IsOptional()
  @IsBoolean()
  audienceParents?: boolean;

  @IsOptional()
  @IsBoolean()
  studentsCanReply?: boolean;

  @IsOptional()
  @IsBoolean()
  parentsCanReply?: boolean;

  @IsOptional()
  @IsIn(VISIBILITIES)
  replyVisibility?: ChannelReplyVisibilityKey;

  /** True archives the channel (read-only); false reopens it. */
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

/** `POST /v1/communication/channels` (FR-COM-003.1–.4). */
export class CreateChannelInput {
  /** ASSIGNMENT channels are only created with their assignment (BR-COM-003.10): 400 here. */
  @IsIn([...CREATABLE_CHANNEL_SCOPES])
  scope: CreatableChannelScopeKey;

  /** The school, study plan, class group or course id. Omitted for ORGANIZATION. */
  @IsOptional()
  @IsString()
  targetId?: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsBoolean()
  audienceStudents: boolean;

  @IsBoolean()
  audienceParents: boolean;

  @IsOptional()
  @IsBoolean()
  studentsCanReply?: boolean;

  @IsOptional()
  @IsBoolean()
  parentsCanReply?: boolean;

  @IsOptional()
  @IsIn(VISIBILITIES)
  replyVisibility?: ChannelReplyVisibilityKey;
}

export class CreateChannelPostInput {
  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(10000)
  body: string;

  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean;
}

export class CreateChannelReplyInput {
  @IsString()
  @IsNotEmpty({ message: 'La respuesta no puede estar vacía' })
  @MaxLength(5000)
  body: string;

  /** Managers in PRIVATE channels: the member whose conversation they answer. */
  @IsOptional()
  @IsString()
  threadUserId?: string;
}

/** `POST /v1/communication/direct` (FR-COM-003.12). */
export class StartDirectInput {
  @IsString()
  @IsNotEmpty()
  parentUserId: string;

  /** The child the conversation is about. */
  @IsOptional()
  @IsString()
  studentId?: string;

  /** Optional first message. */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;
}

/** `POST /v1/communication/direct/:id/report` (FR-COM-003.20). */
export class ReportDirectInput {
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo del reporte' })
  @MaxLength(1000)
  reason: string;
}

/** `POST /v1/communication/direct/reports/:reportId/resolve` (FR-COM-003.20). */
export class ResolveDirectReportInput {
  @IsString()
  @IsNotEmpty({ message: 'Indica cómo se resolvió el reporte' })
  @MaxLength(1000)
  resolution: string;
}

export class SendDirectMessageInput {
  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(5000)
  body: string;
}
