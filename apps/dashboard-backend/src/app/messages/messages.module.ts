import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { MessagesController } from './messages.controller';
import { MessagesResolver } from './messages.resolver';
import { MessagesService } from './messages.service';

@Module({
  controllers: [MessagesController],
  providers: [
    ...(includeNestGraphQlResolvers ? [MessagesResolver] : []),
    MessagesService,
  ],
  imports: [PrismaModule],
})
export class MessagesModule {}
