import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { PrismaModule } from '../prisma.module';
import { GradeAccessService } from './grade-access.service';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { UnpublishedGradesReminderService } from './unpublished-grades-reminder.service';

@Module({
  controllers: [GradesController],
  providers: [
    GradesService,
    GradeAccessService,
    UnpublishedGradesReminderService,
  ],
  imports: [PrismaModule, CoursesModule],
  exports: [GradesService, GradeAccessService],
})
export class GradesModule {}
