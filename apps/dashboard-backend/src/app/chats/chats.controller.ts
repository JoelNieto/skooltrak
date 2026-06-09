import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { AddChatParticipantsInput } from './dto/add-chat-participants.input';
import { CreateContextualChatInput } from './dto/create-contextual-chat.input';
import { CreateGroupChatInput } from './dto/create-group-chat.input';
import { SendMessageInput } from './dto/send-message.input';

@ApiTags('chats')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_MESSAGES)
@Controller('v1/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('direct')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Create direct chat' })
  createDirectChat(@Body() body: { recipientId: string }) {
    return this.chatsService.createDirectChat(body.recipientId);
  }

  @Post('group')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Create group chat' })
  createGroupChat(@Body() input: CreateGroupChatInput) {
    return this.chatsService.createGroupChat(input);
  }

  @Post('contextual')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Create contextual chat' })
  createContextualChat(@Body() input: CreateContextualChatInput) {
    return this.chatsService.createContextualChat(input);
  }

  @Get()
  @ApiOperation({ summary: 'My chats' })
  myChats() {
    return this.chatsService.myChats();
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread chat count' })
  chatUnreadCount() {
    return this.chatsService.unreadCount();
  }

  @Post('messages')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Send chat message' })
  sendMessage(@Body() input: SendMessageInput) {
    return this.chatsService.sendMessage(input);
  }

  @Post('participants')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Add chat participants' })
  addChatParticipants(@Body() input: AddChatParticipantsInput) {
    return this.chatsService.addChatParticipants(input);
  }

  @Post(':chatId/leave')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Leave chat' })
  async leaveChat(@Param('chatId') chatId: string) {
    await this.chatsService.leaveChat(chatId);
    return true;
  }

  @Patch(':chatId/read')
  @ApiOperation({ summary: 'Mark chat read' })
  markChatRead(@Param('chatId') chatId: string) {
    return this.chatsService.markChatRead(chatId);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Chat messages' })
  async chatMessages(
    @Query('chatId') chatId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const list = await this.chatsService.chatMessages({
      chatId,
      cursor,
      limit: limit != null ? Number(limit) : 50,
    });
    return list.map((m) => ({
      ...m,
      sender: {
        ...m.sender,
        initials: `${m.sender?.firstName?.charAt(0) ?? ''}${m.sender?.lastName?.charAt(0) ?? ''}`.toUpperCase(),
      },
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by id' })
  chat(@Param('id') id: string) {
    return this.chatsService.chat(id);
  }
}
