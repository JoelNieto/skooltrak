import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ChatRetentionService } from './chat-retention.service';
import { ChatSyncService } from './chat-sync.service';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatSocketGateway } from './chat-socket.gateway';
import { ChatWsAuthService } from './chat-ws-auth.service';

@Module({
  controllers: [ChatsController],
  imports: [PrismaModule],
  providers: [
    ChatsService,
    ChatSyncService,
    ChatSocketGateway,
    ChatWsAuthService,
    ChatRetentionService,
  ],
  exports: [ChatsService, ChatSyncService],
})
export class ChatsModule {}
