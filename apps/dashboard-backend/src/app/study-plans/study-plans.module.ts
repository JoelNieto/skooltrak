import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudyPlansController } from './study-plans.controller';
import { StudyPlansService } from './study-plans.service';

@Module({
  controllers: [StudyPlansController],
  providers: [
    StudyPlansService,
  ],
  imports: [PrismaModule],
  exports: [StudyPlansService],
})
export class StudyPlansModule {}
