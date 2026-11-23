import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { CHANNEL_SCOPES, ChannelScopeKey, CommunicationUnread } from '@/shared';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { DirectService } from './direct.service';
import {
  CreateChannelInput,
  CreateChannelPostInput,
  CreateChannelReplyInput,
  SendDirectMessageInput,
  StartDirectInput,
  UpdateChannelInput,
} from './dto/communication.input';

/** COM-003: channels (one-to-many) and direct messages (staff ↔ parent). */
@ApiTags('communication')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.COMMUNICATION_VIEW)
@Controller('v1/communication')
export class CommunicationController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly direct: DirectService,
  ) {}

  @Get('unread')
  @ApiOperation({ summary: 'Unread channel posts and direct messages (FR-COM-003.15)' })
  async unread(@Req() req: AuthenticatedRequest): Promise<CommunicationUnread> {
    const [channels, direct] = await Promise.all([
      this.channels.unreadCount(req.user),
      this.direct.unreadCount(req.user),
    ]);
    return { channels, direct };
  }

  // ── Channels ────────────────────────────────────────────────────────────

  @Get('channels')
  @ApiOperation({ summary: 'Channels the caller manages or belongs to (FR-COM-003.11)' })
  listChannels(@Req() req: AuthenticatedRequest) {
    return this.channels.list(req.user);
  }

  @Get('channels/recent')
  @ApiQuery({ name: 'take', required: false })
  @ApiOperation({ summary: 'Latest channel posts for home pages (FR-COM-003.16)' })
  recent(@Req() req: AuthenticatedRequest, @Query('take') take?: string) {
    return this.channels.recent(req.user, take ? Number(take) : 5);
  }

  @Get('channels/targets')
  @RequirePermissions(Perm.COMMUNICATION_CHANNELS)
  @ApiQuery({ name: 'scope', enum: CHANNEL_SCOPES })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiOperation({ summary: 'What the caller may target at a level (BR-COM-003.2)' })
  targets(@Req() req: AuthenticatedRequest, @Query('scope') scope: string, @Query('schoolId') schoolId?: string) {
    if (!(CHANNEL_SCOPES as readonly string[]).includes(scope)) throw new BadRequestException('Nivel inválido');
    return this.channels.targets(req.user, scope as ChannelScopeKey, schoolId);
  }

  @Post('channels')
  @RequirePermissions(Perm.COMMUNICATION_CHANNELS)
  @ApiOperation({ summary: 'Create a channel (FR-COM-003.1–.4)' })
  createChannel(@Req() req: AuthenticatedRequest, @Body() input: CreateChannelInput) {
    return this.channels.create(req.user, input);
  }

  @Get('channels/:id')
  @ApiOperation({ summary: 'A channel with its latest posts (FR-COM-003.7, .9)' })
  getChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channels.get(req.user, id);
  }

  @Patch('channels/:id')
  @RequirePermissions(Perm.COMMUNICATION_CHANNELS)
  @ApiOperation({ summary: 'Edit a channel or archive it (FR-COM-003.5)' })
  updateChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() input: UpdateChannelInput) {
    return this.channels.update(req.user, id, input);
  }

  @Post('channels/:id/read')
  @ApiOperation({ summary: "Mark the channel's posts read (FR-COM-003.8)" })
  markChannelRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channels.markRead(req.user, id);
  }

  @Post('channels/:id/posts')
  @RequirePermissions(Perm.COMMUNICATION_CHANNELS)
  @ApiOperation({ summary: 'Publish a post (FR-COM-003.6)' })
  createPost(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() input: CreateChannelPostInput) {
    return this.channels.createPost(req.user, id, input);
  }

  @Delete('channels/:id/posts/:postId')
  @RequirePermissions(Perm.COMMUNICATION_CHANNELS)
  @ApiOperation({ summary: 'Delete a post' })
  deletePost(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('postId') postId: string) {
    return this.channels.deletePost(req.user, id, postId);
  }

  @Post('channels/:id/posts/:postId/confirm')
  @ApiOperation({ summary: 'Confirm reading a post (FR-COM-003.8)' })
  confirm(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('postId') postId: string) {
    return this.channels.confirm(req.user, id, postId);
  }

  @Get('channels/:id/posts/:postId/receipts')
  @RequirePermissions(Perm.COMMUNICATION_CHANNELS)
  @ApiOperation({ summary: 'Who read and confirmed a post (FR-COM-003.9)' })
  receipts(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('postId') postId: string) {
    return this.channels.receipts(req.user, id, postId);
  }

  @Get('channels/:id/posts/:postId/replies')
  @ApiQuery({ name: 'member', required: false })
  @ApiOperation({ summary: 'Replies the caller may see (FR-COM-003.10)' })
  replies(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Query('member') member?: string,
  ) {
    return this.channels.replies(req.user, id, postId, member);
  }

  @Post('channels/:id/posts/:postId/replies')
  @ApiOperation({ summary: 'Reply to a post (FR-COM-003.10)' })
  reply(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Body() input: CreateChannelReplyInput,
  ) {
    return this.channels.reply(req.user, id, postId, input);
  }

  // ── Direct ──────────────────────────────────────────────────────────────

  @Get('direct')
  @RequirePermissions(Perm.COMMUNICATION_DIRECT)
  @ApiOperation({ summary: "The caller's direct conversations (FR-COM-003.14)" })
  listDirect(@Req() req: AuthenticatedRequest) {
    return this.direct.list(req.user);
  }

  @Get('direct/recipients')
  @RequirePermissions(Perm.COMMUNICATION_DIRECT)
  @ApiQuery({ name: 'q', required: false })
  @ApiOperation({ summary: 'Parents the caller may message, by student (BR-COM-003.8)' })
  recipients(@Req() req: AuthenticatedRequest, @Query('q') q?: string) {
    return this.direct.recipients(req.user, q);
  }

  @Post('direct')
  @RequirePermissions(Perm.COMMUNICATION_DIRECT)
  @ApiOperation({ summary: 'Start or reopen a conversation with a parent (FR-COM-003.12)' })
  startDirect(@Req() req: AuthenticatedRequest, @Body() input: StartDirectInput) {
    return this.direct.start(req.user, input);
  }

  @Get('direct/:id')
  @RequirePermissions(Perm.COMMUNICATION_DIRECT)
  @ApiOperation({ summary: 'A conversation with its messages; marks it read (FR-COM-003.13)' })
  getDirect(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.direct.get(req.user, id);
  }

  @Post('direct/:id/messages')
  @RequirePermissions(Perm.COMMUNICATION_DIRECT)
  @ApiOperation({ summary: 'Send a direct message (FR-COM-003.13)' })
  sendDirect(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() input: SendDirectMessageInput) {
    return this.direct.send(req.user, id, input);
  }
}

