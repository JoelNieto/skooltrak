import { Module } from '@nestjs/common';
import { CommunicationModule } from '../communication/communication.module';
import { PrismaModule } from '../prisma.module';
import { AssignmentAccessService } from './assignment-access.service';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService, AssignmentAccessService],
  // COM-003-S02: every assignment gets its Q&A channel.
  imports: [PrismaModule, CommunicationModule],
})
export class AssignmentsModule {}
