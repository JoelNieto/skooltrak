import { Module } from '@nestjs/common';
import { GradesModule } from '../grades/grades.module';
import { PrismaModule } from '../prisma.module';
import { SchoolsModule } from '../schools/schools.module';
import { GradeReportResolver } from './grade-report.resolver';
import { GradeReportService } from './grade-report.service';

@Module({
  providers: [GradeReportResolver, GradeReportService],
  imports: [PrismaModule, GradesModule, SchoolsModule],
})
export class GradeReportModule {}
