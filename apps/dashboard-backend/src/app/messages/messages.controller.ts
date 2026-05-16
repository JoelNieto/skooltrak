import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { FetchDataQueryDto } from '@/api-contracts';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toFetchDataInput } from '../fetch-data-query.mapper';
import { CreateMessageInput } from './dto/create-message.input';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_MESSAGES)
@Controller('v1/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Create message' })
  createMessage(@Body() createMessageInput: CreateMessageInput) {
    return this.messagesService.create(createMessageInput);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Messages sent by me' })
  findMyMessages(@Query() query: FetchDataQueryDto) {
    return this.messagesService.findManyBySender(toFetchDataInput(query));
  }

  @Get()
  @ApiOperation({ summary: 'Inbox messages' })
  findManyMessages(@Query() query: FetchDataQueryDto) {
    return this.messagesService.findMany(toFetchDataInput(query));
  }

  @Get('count')
  @ApiOperation({ summary: 'Inbox count' })
  findManyMessagesCount() {
    return this.messagesService.findCount();
  }

  @Get('sent-count')
  @ApiOperation({ summary: 'Sent count' })
  findSentMessagesCount() {
    return this.messagesService.findSentCount();
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Contacts for messaging' })
  findContacts(@Query('queryText') queryText?: string) {
    return this.messagesService.findContacts(queryText ?? '');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread messages count' })
  unreadMessagesCount() {
    return this.messagesService.findUnreadCount();
  }

  @Patch(':messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markMessageAsRead(@Param('messageId') messageId: string) {
    return this.messagesService.markAsRead(messageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Message by id' })
  findMessageById(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Remove message' })
  removeMessage(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }

  @Delete('recipients/:id')
  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @ApiOperation({ summary: 'Remove message recipient' })
  removeMessageRecipient(@Param('id') id: string) {
    return this.messagesService.removeRecipient(id);
  }
}
