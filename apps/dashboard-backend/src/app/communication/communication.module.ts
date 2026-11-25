import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AssignmentChannelsService } from './assignment-channels.service';
import { ChannelsService } from './channels.service';
import { ConfirmationRemindersService } from './confirmation-reminders.service';
import { CommunicationController } from './communication.controller';
import { DirectService } from './direct.service';

/** COM-003: channels and direct messages, the only two ways to communicate. */
@Module({
  controllers: [CommunicationController],
  imports: [PrismaModule],
  // COM-003-S05: the hourly confirmation reminders (FR .21).
  providers: [ChannelsService, DirectService, AssignmentChannelsService, ConfirmationRemindersService],
  exports: [ChannelsService, DirectService, AssignmentChannelsService],
})
export class CommunicationModule {}
