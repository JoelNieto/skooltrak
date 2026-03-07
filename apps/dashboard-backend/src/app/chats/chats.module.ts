import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ChatRetentionService } from './chat-retention.service';
import { ChatSyncService } from './chat-sync.service';
import { ChatsResolver } from './chats.resolver';
import { ChatsService } from './chats.service';
import { ChatsSubscriptionResolver } from './chats-subscription.resolver';
import { ChatPubSub } from './chat-pubsub';

@Module({
  imports: [PrismaModule],
  providers: [
    ChatsService,
    ChatSyncService,
    ChatsResolver,
    ChatsSubscriptionResolver,
    ChatPubSub,
    ChatRetentionService,
  ],
  exports: [ChatsService, ChatSyncService],
})
export class ChatsModule {}
