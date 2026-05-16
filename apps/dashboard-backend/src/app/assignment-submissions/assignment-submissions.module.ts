import { Module } from '@nestjs/common';
import { includeNestGraphQlResolvers } from '@/auth';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma.module';
import { AssignmentSubmissionsController } from './assignment-submissions.controller';
import { AssignmentSubmissionsResolver } from './assignment-submissions.resolver';
import { AssignmentSubmissionsService } from './assignment-submissions.service';

@Module({
  controllers: [AssignmentSubmissionsController],
  imports: [PrismaModule, ConfigModule],
  providers: [
    ...(includeNestGraphQlResolvers ? [AssignmentSubmissionsResolver] : []),
    AssignmentSubmissionsService,
  ],
  exports: [AssignmentSubmissionsService],
})
export class AssignmentSubmissionsModule {}
