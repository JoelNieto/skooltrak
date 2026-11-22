import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignmentAccessService, groupFilter, MOVE_DENIED } from './assignment-access.service';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';

/**
 * Assignments. Reads need VIEW_ASSIGNMENTS and are limited to the caller's organization (students
 * and parents: their own groups' dates). Writes need MANAGE_ASSIGNMENTS and the course's teacher
 * or an admin of its organization.
 */
@ApiTags('assignments')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_ASSIGNMENTS)
@Controller('v1/assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly access: AssignmentAccessService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_ASSIGNMENTS)
  @ApiOperation({ summary: 'Create assignment' })
  async create(@Req() req: AuthenticatedRequest, @Body() createAssignmentInput: CreateAssignmentInput) {
    const course = await this.access.assertCanWrite(req.user, createAssignmentInput.courseId);
    await this.access.assertInputFits(course, createAssignmentInput);
    return this.assignmentsService.create(createAssignmentInput, course.schoolId);
  }

  @Get()
  @RequirePermissions(Perm.MANAGE_ASSIGNMENTS)
  @ApiOperation({ summary: "List the organization's assignments" })
  findAll(@Req() req: AuthenticatedRequest) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization context required');
    return this.assignmentsService.findAll(organizationId);
  }

  @Get('by-school')
  @ApiOperation({ summary: 'Assignments by school and date range' })
  async findAssignmentBySchoolId(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const scope = await this.access.schoolScope(req.user, schoolId);
    return this.assignmentsService.findAssignmentBySchoolId(
      schoolId,
      new Date(startDate),
      new Date(endDate),
      groupFilter(scope),
    );
  }

  @Get('by-course')
  @ApiOperation({ summary: 'Assignments by course and date range' })
  async findAssignmentByCourseId(
    @Req() req: AuthenticatedRequest,
    @Query('courseId') courseId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const scope = await this.access.courseScope(req.user, courseId);
    return this.assignmentsService.findAssignmentByCourseId(
      courseId,
      new Date(startDate),
      new Date(endDate),
      groupFilter(scope),
    );
  }

  @Get('dates/by-school')
  @ApiOperation({ summary: 'Assignment dates by school' })
  async findAssignmentDatesBySchoolId(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('classGroupId') classGroupId?: string,
  ) {
    const scope = await this.access.schoolScope(req.user, schoolId);
    return this.assignmentsService.findAssignmentDatesBySchoolId(
      schoolId,
      new Date(startDate),
      new Date(endDate),
      groupFilter(scope, classGroupId || undefined),
    );
  }

  @Get('dates/by-course')
  @ApiOperation({ summary: 'Assignment dates by course' })
  async findAssignmentDatesByCourseId(
    @Req() req: AuthenticatedRequest,
    @Query('courseId') courseId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('classGroupId') classGroupId?: string,
  ) {
    const scope = await this.access.courseScope(req.user, courseId);
    return this.assignmentsService.findAssignmentDatesByCourseId(
      courseId,
      new Date(startDate),
      new Date(endDate),
      groupFilter(scope, classGroupId || undefined),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const ref = await this.access.assignmentRef(id);
    const scope = await this.access.courseScope(req.user, ref.courseId);
    return this.assignmentsService.findOne(ref.id, groupFilter(scope));
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_ASSIGNMENTS)
  @ApiOperation({ summary: 'Update assignment' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateAssignmentInput: UpdateAssignmentInput) {
    const existing = await this.access.assignmentRef(updateAssignmentInput.id);
    const course = await this.access.assertCanWrite(req.user, existing.courseId);
    if (
      (updateAssignmentInput.courseId && updateAssignmentInput.courseId !== existing.courseId) ||
      (updateAssignmentInput.schoolId && updateAssignmentInput.schoolId !== existing.schoolId)
    ) {
      throw new BadRequestException(MOVE_DENIED);
    }
    await this.access.assertInputFits(course, updateAssignmentInput);
    return this.assignmentsService.update(existing.id, updateAssignmentInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_ASSIGNMENTS)
  @ApiOperation({ summary: 'Delete assignment' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const existing = await this.access.assignmentRef(id);
    await this.access.assertCanWrite(req.user, existing.courseId);
    return this.assignmentsService.remove(existing.id);
  }
}
