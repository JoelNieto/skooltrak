import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AssignmentAccessService } from './assignment-access.service';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService, AssignmentAccessService],
  imports: [PrismaModule],
})
export class AssignmentsModule {}
