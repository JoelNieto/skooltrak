import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { PrismaModule } from '../prisma.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsResolver } from './assignments.resolver';
import { AssignmentsService } from './assignments.service';

@Module({
  controllers: [AssignmentsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [AssignmentsResolver] : []),
    AssignmentsService,
  ],
  imports: [PrismaModule, ChatsModule],
})
export class AssignmentsModule {}
