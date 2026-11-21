import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Gradebook, GradebookCourses } from './entities/gradebook.entity';
import { GradebookService } from './gradebook.service';

/**
 * Teacher gradebook (ASM-001). Read-only in S02. Every route needs MANAGE_GRADES; a course's
 * gradebook is open to its teacher and to admins of its organization (BR-ASM-001.1).
 */
@ApiTags('gradebook')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.MANAGE_GRADES)
@Controller('v1/gradebook')
export class GradebookController {
  constructor(private readonly gradebook: GradebookService) {}

  @Get('courses')
  @ApiOperation({ summary: "Gradebook course picker: the caller's courses, last graded first (FR-ASM-001.1)" })
  courses(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<GradebookCourses> {
    return this.gradebook.courses(req.user, schoolId);
  }

  @Get(':courseId')
  @ApiOperation({ summary: "A course's gradebook for one group and period (FR-ASM-001.2, .3, .5)" })
  @ApiQuery({ name: 'periodId', required: false, description: 'Defaults to the current period' })
  @ApiQuery({ name: 'classGroupId', required: false, description: 'Defaults to the first group; "none" for students without one' })
  course(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Query('periodId') periodId?: string,
    @Query('classGroupId') classGroupId?: string,
  ): Promise<Gradebook> {
    return this.gradebook.gradebook(req.user, courseId, { periodId, classGroupId });
  }
}
