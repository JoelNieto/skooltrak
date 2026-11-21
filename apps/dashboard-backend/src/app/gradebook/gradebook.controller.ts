import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublishGradesInput } from './dto/publish-grades.input';
import { SaveCellsInput } from './dto/save-cells.input';
import {
  Gradebook,
  GradebookAssignments,
  GradebookCourses,
  GradebookHistory,
  GradebookPublished,
  GradebookSavedCells,
} from './entities/gradebook.entity';
import { GradebookService } from './gradebook.service';

/**
 * Teacher gradebook (ASM-001). Every route needs MANAGE_GRADES; a course's
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

  @Get(':courseId/assignments')
  @ApiOperation({ summary: "The course's assignments, with the column linked to each (FR-ASM-001.11)" })
  assignments(@Req() req: AuthenticatedRequest, @Param('courseId') courseId: string): Promise<GradebookAssignments> {
    return this.gradebook.assignments(req.user, courseId);
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

  @Put(':courseId/cells')
  @ApiOperation({ summary: 'Save changed draft cells of one period in one transaction (FR-ASM-001.6, BR .2, .7, .10)' })
  saveCells(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Body() input: SaveCellsInput,
  ): Promise<GradebookSavedCells> {
    return this.gradebook.saveCells(req.user, courseId, input);
  }

  @Post(':courseId/publish')
  @HttpCode(200)
  @ApiOperation({ summary: "Publish the course's draft columns and notify families (FR-ASM-001.7, BR .9)" })
  publish(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Body() input: PublishGradesInput,
  ): Promise<GradebookPublished> {
    return this.gradebook.publish(req.user, courseId, input.gradeIds);
  }

  @Get('cells/:studentGradeId/history')
  @ApiOperation({ summary: "A cell's revisions, newest first (FR-ASM-001.8, BR .8)" })
  history(@Req() req: AuthenticatedRequest, @Param('studentGradeId') studentGradeId: string): Promise<GradebookHistory> {
    return this.gradebook.history(req.user, studentGradeId);
  }
}
