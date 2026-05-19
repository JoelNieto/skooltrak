import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ChatRetentionService } from './chat-retention.service';
import { ChatSyncService } from './chat-sync.service';
import { ChatsController } from './chats.controller';
import { ChatsResolver } from './chats.resolver';
import { ChatsService } from './chats.service';
import { ChatsSubscriptionResolver } from './chats-subscription.resolver';
import { ChatPubSub } from './chat-pubsub';
import { ChatSocketGateway } from './chat-socket.gateway';
import { ChatWsAuthService } from './chat-ws-auth.service';

@Module({
  controllers: [ChatsController],
  imports: [PrismaModule],
  providers: [
    ChatsService,
    ChatSyncService,
    ...(includeNestGraphQlResolvers
      ? [ChatsResolver, ChatsSubscriptionResolver]
      : []),
    ChatSocketGateway,
    ChatWsAuthService,
    ChatPubSub,
    ChatRetentionService,
  ],
  exports: [ChatsService, ChatSyncService],
})
export class ChatsModule {}
