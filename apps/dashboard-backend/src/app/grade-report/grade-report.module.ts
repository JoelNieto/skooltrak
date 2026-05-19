import { Module } from '@nestjs/common';
import { GradesModule } from '../grades/grades.module';
import { PrismaModule } from '../prisma.module';
import { SchoolsModule } from '../schools/schools.module';
import { GradeReportController } from './grade-report.controller';
import { GradeReportService } from './grade-report.service';

@Module({
  controllers: [GradeReportController],
  providers: [
    GradeReportService,
  ],
  imports: [PrismaModule, GradesModule, SchoolsModule],
})
export class GradeReportModule {}
