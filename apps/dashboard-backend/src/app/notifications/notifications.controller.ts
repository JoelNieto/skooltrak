import { AuthenticatedRequest, BetterAuthGuard, PermissionsGuard } from '@/auth';
import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationList } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

/** The caller's in-app notifications (ASM-001-S08). Any signed-in user; always their own only. */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "The caller's notifications, newest first, with the unread count" })
  @ApiQuery({ name: 'unread', required: false, description: '"true" lists unread ones only' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'take', required: false, description: 'At most 50' })
  list(
    @Req() req: AuthenticatedRequest,
    @Query('unread') unread?: string,
    @Query('type') type?: string,
    @Query('take') take?: string,
  ): Promise<NotificationList> {
    return this.notifications.list(req.user, {
      unread: unread === 'true',
      type: type || undefined,
      take: take ? Number(take) || undefined : undefined,
    });
  }

  @Patch('read')
  @ApiOperation({ summary: "Mark all the caller's notifications read" })
  markAllRead(@Req() req: AuthenticatedRequest): Promise<{ updated: number }> {
    return this.notifications.markAllRead(req.user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one of the caller’s notifications read' })
  markRead(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<{ updated: number }> {
    return this.notifications.markRead(req.user, id);
  }
}
