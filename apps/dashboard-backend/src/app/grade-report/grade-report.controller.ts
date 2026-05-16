import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradeReportService } from './grade-report.service';

@ApiTags('grade-report')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_STUDENTS)
@Controller('v1/grade-report')
export class GradeReportController {
  constructor(private readonly gradeReportService: GradeReportService) {}

  @Get()
  @ApiOperation({ summary: 'Grade report for student and period' })
  getGradeReport(@Query('studentId') studentId: string, @Query('periodId') periodId: string) {
    return this.gradeReportService.getGradeReport(studentId, periodId);
  }
}
