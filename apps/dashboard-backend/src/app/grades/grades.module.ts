import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { PrismaModule } from '../prisma.module';
import { GradesResolver } from './grades.resolver';
import { GradesService } from './grades.service';
import { UnpublishedGradesReminderService } from './unpublished-grades-reminder.service';

@Module({
  providers: [GradesResolver, GradesService, UnpublishedGradesReminderService],
  imports: [PrismaModule, CoursesModule],
  exports: [GradesService],
})
export class GradesModule {}
