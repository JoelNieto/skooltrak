import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudyPlansResolver } from './study-plans.resolver';
import { StudyPlansService } from './study-plans.service';

@Module({
  providers: [StudyPlansResolver, StudyPlansService],
  imports: [PrismaModule],
})
export class StudyPlansModule {}
