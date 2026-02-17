import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { GradeReport } from './entities';
import { GradeReportService } from './grade-report.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_STUDENTS)
@Resolver()
export class GradeReportResolver {
  constructor(private readonly gradeReportService: GradeReportService) {}

  @Query(() => GradeReport, {
    name: 'gradeReport',
    description: 'Get the grade report (Boletin de calificaciones) for a student and period',
  })
  getGradeReport(
    @Args('studentId', { type: () => String }) studentId: string,
    @Args('periodId', { type: () => String }) periodId: string,
  ) {
    return this.gradeReportService.getGradeReport(studentId, periodId);
  }
}
