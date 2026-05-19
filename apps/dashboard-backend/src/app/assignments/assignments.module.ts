import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { PrismaModule } from '../prisma.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
  ],
  imports: [PrismaModule, ChatsModule],
})
export class AssignmentsModule {}
