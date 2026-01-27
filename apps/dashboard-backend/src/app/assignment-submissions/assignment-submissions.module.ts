import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma.module';
import { AssignmentSubmissionsResolver } from './assignment-submissions.resolver';
import { AssignmentSubmissionsService } from './assignment-submissions.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [AssignmentSubmissionsResolver, AssignmentSubmissionsService],
  exports: [AssignmentSubmissionsService],
})
export class AssignmentSubmissionsModule {}
