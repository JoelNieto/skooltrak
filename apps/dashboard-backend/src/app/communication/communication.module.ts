import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AssignmentChannelsService } from './assignment-channels.service';
import { ChannelsService } from './channels.service';
import { CommunicationController } from './communication.controller';
import { DirectService } from './direct.service';

/** COM-003: channels and direct messages, the only two ways to communicate. */
@Module({
  controllers: [CommunicationController],
  imports: [PrismaModule],
  providers: [ChannelsService, DirectService, AssignmentChannelsService],
  exports: [ChannelsService, DirectService, AssignmentChannelsService],
})
export class CommunicationModule {}
