import {
  AllowAnonymous,
  BetterAuthGuard,
  Perm,
  PermissionsGuard,
  RequirePermissions,
} from '@/auth';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ThreadStatus } from '@generated/prisma';
import { CanInitiateGuard } from './communication.guards';
import { CommunicationService } from './communication.service';
import {
  AddParticipantBodyInput,
  BroadcastInput,
  CreateThreadInput,
  DeliveryPreviewInput,
  PreferenceInput,
  SendMessageBodyInput,
  SubscriberSyncInput,
  UpdateBroadcastInput,
} from './dto/communication.input';

@ApiTags('communication')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.COMMUNICATION_VIEW)
@Controller('v1/communication')
export class CommunicationController {
  constructor(private readonly communication: CommunicationService) {}

  // ── Threads ─────────────────────────────────────────────────────────────
  @Post('threads')
  @UseGuards(CanInitiateGuard)
  @RequirePermissions(Perm.COMMUNICATION_VIEW)
  @ApiOperation({ summary: 'Create a communication thread' })
  createThread(@Body() input: CreateThreadInput) {
    return this.communication.createThread(input);
  }

  @Get('threads')
  @ApiOperation({ summary: 'List threads visible to the caller' })
  listThreads() {
    return this.communication.listThreads();
  }

  @Get('inbox/broadcasts')
  @ApiOperation({ summary: 'Latest approved broadcasts visible to the caller' })
  listInboxBroadcasts(@Query('take') take?: string) {
    return this.communication.listRecentBroadcasts(take ? Number(take) : 5);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Get a thread' })
  getThread(@Param('id') id: string) {
    return this.communication.getThread(id);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'List messages in a thread' })
  getMessages(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communication.getMessages(id, cursor, limit ? Number(limit) : 50);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send a message (reply-only roles allowed)' })
  sendMessage(@Param('id') id: string, @Body() body: SendMessageBodyInput, @Req() req?: Request) {
    return this.communication.sendMessage({ ...body, threadId: id }, req?.ip);
  }

  @Post('threads/:id/messages/:mid/reply')
  @ApiOperation({ summary: 'Reply within a thread' })
  reply(
    @Param('id') id: string,
    @Param('mid') _mid: string,
    @Body() body: SendMessageBodyInput,
    @Req() req?: Request,
  ) {
    return this.communication.sendMessage({ ...body, threadId: id }, req?.ip);
  }

  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Mark a message read (updates delivery receipt)' })
  markRead(@Param('id') id: string) {
    return this.communication.markRead(id);
  }

  @Post('threads/:id/typing')
  @ApiOperation({ summary: 'Emit typing indicator' })
  typing(@Param('id') id: string) {
    return this.communication.emitTyping(id);
  }

  // ── Roster & permissions ────────────────────────────────────────────────
  @Get('roster/class-group/:id/recipients')
  @ApiOperation({ summary: 'Recipients for a class group' })
  classGroupRecipients(@Param('id') id: string) {
    return this.communication.classGroupRecipients(id);
  }

  @Get('roster/student/:id/guardians')
  @ApiOperation({ summary: 'Guardians of a student' })
  studentGuardians(@Param('id') id: string) {
    return this.communication.studentGuardians(id);
  }

  @Post('threads/:id/participants')
  @UseGuards(CanInitiateGuard)
  @ApiOperation({ summary: 'Add participants (parents blocked by guard)' })
  addParticipants(@Param('id') id: string, @Body() input: AddParticipantBodyInput) {
    return this.communication.addParticipants({ ...input, threadId: id });
  }

  // ── Delivery (Novu seam) ────────────────────────────────────────────────
  @Post('subscribers/sync')
  @ApiOperation({ summary: 'Sync a Novu subscriber + channel prefs' })
  syncSubscriber(@Body() input: SubscriberSyncInput) {
    return this.communication.syncSubscriber(input);
  }

  @Patch('recipients/:id/preference')
  @ApiOperation({ summary: 'Set recipient preference (language seam)' })
  setPreference(@Param('id') id: string, @Body() input: PreferenceInput) {
    return this.communication.setPreference(id, input);
  }

  @Post('delivery/preview')
  @ApiOperation({ summary: 'Preview which channels a message would hit' })
  deliveryPreview(@Body() input: DeliveryPreviewInput) {
    return this.communication.deliveryPreview(input);
  }

  @Get('messages/:id/deliveries')
  @ApiOperation({ summary: 'Per-recipient/per-channel delivery receipts' })
  getDeliveries(@Param('id') id: string) {
    return this.communication.getDeliveries(id);
  }

  @Post('webhooks/novu')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Novu webhook → reconcile MessageDelivery (HMAC)' })
  novuWebhook(@Body() payload: unknown, @Headers('x-novu-signature') signature?: string) {
    return this.communication.handleNovuWebhook(payload, signature);
  }

  // ── Admin console (broadcasts + audit) ──────────────────────────────────
  @Get('broadcasts')
  @RequirePermissions(Perm.COMMUNICATION_BROADCAST)
  @ApiOperation({ summary: 'List organization broadcasts' })
  listBroadcasts(@Query('status') status?: ThreadStatus) {
    return this.communication.listBroadcasts(status);
  }

  @Get('broadcasts/audiences')
  @RequirePermissions(Perm.COMMUNICATION_BROADCAST)
  @ApiOperation({ summary: 'Class groups and courses the caller may target with a broadcast' })
  listBroadcastAudiences(@Query('schoolId') schoolId?: string) {
    return this.communication.listBroadcastAudiences(schoolId);
  }

  @Post('broadcasts')
  @RequirePermissions(Perm.COMMUNICATION_BROADCAST)
  @ApiOperation({ summary: 'Create a broadcast (pending approval if policy requires)' })
  createBroadcast(@Body() input: BroadcastInput) {
    return this.communication.createBroadcast(input);
  }

  @Post('broadcasts/:id/approve')
  @RequirePermissions(Perm.COMMUNICATION_APPROVE)
  @ApiOperation({ summary: 'Approve a pending broadcast and fan out' })
  approveBroadcast(@Param('id') id: string) {
    return this.communication.approveBroadcast(id);
  }

  @Patch('broadcasts/:id')
  @RequirePermissions(Perm.COMMUNICATION_BROADCAST)
  @ApiOperation({ summary: 'Update broadcast settings such as repliesAllowed' })
  updateBroadcast(@Param('id') id: string, @Body() input: UpdateBroadcastInput) {
    return this.communication.updateBroadcast(id, input);
  }

  @Get('admin/audit')
  @RequirePermissions(Perm.COMMUNICATION_APPROVE)
  @ApiOperation({ summary: 'Communication audit log' })
  audit() {
    return this.communication.listAudit();
  }
}
