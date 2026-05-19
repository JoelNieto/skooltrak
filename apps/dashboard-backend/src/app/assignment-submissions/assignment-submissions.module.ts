import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma.module';
import { AssignmentSubmissionsController } from './assignment-submissions.controller';
import { AssignmentSubmissionsService } from './assignment-submissions.service';

@Module({
  controllers: [AssignmentSubmissionsController],
  imports: [PrismaModule, ConfigModule],
  providers: [
    AssignmentSubmissionsService,
  ],
  exports: [AssignmentSubmissionsService],
})
export class AssignmentSubmissionsModule {}
