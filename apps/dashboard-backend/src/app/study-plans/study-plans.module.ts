import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudyPlansController } from './study-plans.controller';
import { StudyPlansResolver } from './study-plans.resolver';
import { StudyPlansService } from './study-plans.service';

@Module({
  controllers: [StudyPlansController],
  providers: [
    ...(includeNestGraphQlResolvers ? [StudyPlansResolver] : []),
    StudyPlansService,
  ],
  imports: [PrismaModule],
  exports: [StudyPlansService],
})
export class StudyPlansModule {}
