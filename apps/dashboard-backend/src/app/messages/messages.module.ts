import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { MessagesResolver } from './messages.resolver';
import { MessagesService } from './messages.service';

@Module({
  providers: [MessagesResolver, MessagesService],
  imports: [PrismaModule],
})
export class MessagesModule {}
