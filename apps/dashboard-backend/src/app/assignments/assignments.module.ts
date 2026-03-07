import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { PrismaModule } from '../prisma.module';
import { AssignmentsResolver } from './assignments.resolver';
import { AssignmentsService } from './assignments.service';

@Module({
  providers: [AssignmentsResolver, AssignmentsService],
  imports: [PrismaModule, ChatsModule],
})
export class AssignmentsModule {}
