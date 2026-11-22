import { FetchDataQueryDto } from '@/api-contracts';
import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CourseAppearanceService, UploadedCover } from './course-appearance.service';
import { CourseAppearanceInput } from './dto/course-appearance.input';
import { CourseCoverStorage } from './course-cover-storage';
import { CourseHomeroomService } from './course-homeroom.service';
import { CourseRosterAdminService } from './course-roster-admin.service';
import { RosterAddInput } from './dto/roster-add.input';
import { CourseAccessService } from './course-access.service';
import { CoursePageService } from './course-page.service';
import { CoursesMineService } from './courses-mine.service';
import { CourseGradesSummary, CourseParticipants, CourseWork } from './entities/course-page.entity';
import { MyCourses } from './entities/my-courses.entity';
import { CoursesService } from './courses.service';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_COURSES)
@Controller('v1/courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly mineService: CoursesMineService,
    private readonly access: CourseAccessService,
    private readonly page: CoursePageService,
    private readonly appearance: CourseAppearanceService,
    private readonly covers: CourseCoverStorage,
    private readonly roster: CourseRosterAdminService,
    private readonly homeroom: CourseHomeroomService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiOperation({ summary: 'Create course' })
  create(@Body() createCourseInput: CreateCourseInput) {
    return this.coursesService.create(createCourseInput);
  }

  @Get()
  @ApiOperation({ summary: 'List courses' })
  async findAll(@Query() query: FetchDataQueryDto) {
    const resp = await this.coursesService.findAll(query);
    const data = await Promise.all(
      resp.data.map(async ({ coverKey, ...i }) => ({
        ...i,
        teacher: enrichTeacher(i.teacher),
        /** FR-ACA-001.3: presigned cover photo; null keeps the color cover. */
        coverUrl: await this.covers.url(coverKey),
      })),
    );
    return { ...resp, data };
  }

  @Get('homeroom')
  @ApiOperation({
    summary: 'A homeroom teacher\'s "Cursos de {grupo}": colleagues\' courses of their groups (FR-ACA-001.18)',
  })
  homeroomCourses(@Req() req: AuthenticatedRequest) {
    return this.homeroom.list(req.user);
  }

  @Get('mine')
  @ApiOperation({
    summary: "A student's (or a parent's linked child's) course cards and stats for one period (FR-ACA-001.4–.8)",
  })
  @ApiQuery({ name: 'periodId', required: false, description: 'Defaults to the current period' })
  @ApiQuery({
    name: 'studentId',
    required: false,
    description: 'Parents: a linked child (FR-ACA-001.8); ignored for students',
  })
  mine(
    @Req() req: AuthenticatedRequest,
    @Query('periodId') periodId?: string,
    @Query('studentId') studentId?: string,
  ): Promise<MyCourses> {
    return this.mineService.mine(req.user, { periodId, studentId });
  }

  @Get('count')
  @ApiOperation({ summary: 'Courses count' })
  count(@Query() query: FetchDataQueryDto) {
    return this.coursesService.count(query);
  }

  @Get('by-school/:schoolId')
  @ApiOperation({ summary: 'Courses by school id' })
  findManyBySchoolId(@Param('schoolId') schoolId: string) {
    return this.coursesService.findManyBySchoolId(schoolId);
  }

  @Get('by-subject/:subjectId')
  @ApiOperation({ summary: 'Courses by subject id' })
  findManyBySubjectId(@Param('subjectId') subjectId: string) {
    return this.coursesService.findManyBySubjectId(subjectId);
  }

  @Get('by-study-plan/:studyPlanId')
  @ApiOperation({ summary: 'Courses by study plan id' })
  findManyByStudyPlanId(@Param('studyPlanId') studyPlanId: string) {
    return this.coursesService.findManyByStudyPlanId(studyPlanId);
  }

  @Get('by-group/:groupId')
  @ApiOperation({ summary: 'Courses by class group id' })
  findManyByGroupId(@Param('groupId') groupId: string) {
    return this.coursesService.findManyByGroupId(groupId);
  }

  @Get(':id/work')
  @ApiOperation({ summary: "The student's work in the course, with status (FR-ACA-001.12, .13)" })
  @ApiQuery({ name: 'studentId', required: false, description: 'Parents: a linked child enrolled in the course' })
  async work(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('studentId') studentId?: string,
  ): Promise<CourseWork> {
    const viewer = await this.access.viewer(req.user, id, studentId);
    return this.page.work(id, viewer);
  }

  @Patch(':id/appearance')
  @RequirePermissions(Perm.CUSTOMIZE_COURSES)
  @ApiOperation({ summary: "Set a course's color and icon: its teacher or an admin (FR-ACA-001.3, BR .12)" })
  setAppearance(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() input: CourseAppearanceInput) {
    return this.appearance.setAppearance(req.user, id, input);
  }

  @Post(':id/cover')
  @RequirePermissions(Perm.CUSTOMIZE_COURSES)
  // The 2 MB rule answers 400 in the service; this only stops absurd uploads early.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload the cover photo: JPEG, PNG or WebP, at most 2 MB (FR-ACA-001.3, BR .12)' })
  uploadCover(@Req() req: AuthenticatedRequest, @Param('id') id: string, @UploadedFile() file?: UploadedCover) {
    return this.appearance.uploadCover(req.user, id, file);
  }

  @Delete(':id/cover')
  @RequirePermissions(Perm.CUSTOMIZE_COURSES)
  @ApiOperation({ summary: 'Remove the cover photo (FR-ACA-001.3, BR .12)' })
  removeCover(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.appearance.removeCover(req.user, id);
  }

  @Get(':id/roster')
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiOperation({ summary: "A course's enrollments with source and excluded flag, for admins (FR-ACA-001.19)" })
  getRoster(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.roster.roster(req.user, id);
  }

  @Get(':id/roster/candidates')
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiQuery({ name: 'search', required: false })
  @ApiOperation({ summary: "Students of the course's school who can be added (FR-ACA-001.19)" })
  getRosterCandidates(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('search') search?: string) {
    return this.roster.candidates(req.user, id, search);
  }

  @Post(':id/roster')
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiOperation({ summary: 'Add a student (manual enrollment) or restore an excluded one (FR-ACA-001.19, BR .15)' })
  addToRoster(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() input: RosterAddInput) {
    return this.roster.add(req.user, id, input.studentId);
  }

  @Delete(':id/roster/:studentId')
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiOperation({
    summary: 'Remove a student: deletes a manual enrollment, excludes a plan one (FR-ACA-001.19, BR .15)',
  })
  removeFromRoster(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('studentId') studentId: string) {
    return this.roster.remove(req.user, id, studentId);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: "The course's teachers and students (FR-ACA-001.15, BR .13)" })
  @ApiQuery({ name: 'studentId', required: false, description: 'Parents: a linked child enrolled in the course' })
  async participants(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('studentId') studentId?: string,
  ): Promise<CourseParticipants> {
    const viewer = await this.access.viewer(req.user, id, studentId);
    return this.page.participants(id, viewer);
  }

  @Get(':id/grades-summary')
  @ApiOperation({ summary: "The student's grades in the course for one period (FR-ACA-001.14)" })
  @ApiQuery({ name: 'periodId', required: false, description: 'Defaults to the current period' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Parents: a linked child enrolled in the course' })
  async gradesSummary(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('periodId') periodId?: string,
    @Query('studentId') studentId?: string,
  ): Promise<CourseGradesSummary> {
    const viewer = await this.access.viewer(req.user, id, studentId);
    return this.page.gradesSummary(id, viewer, periodId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by id, for the callers BR-ACA-001.3 allows (FR-ACA-001.10)' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Parents: a linked child enrolled in the course' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('studentId') studentId?: string) {
    const viewer = await this.access.viewer(req.user, id, studentId);
    return this.page.course(id, viewer);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiOperation({ summary: 'Update course' })
  update(@Body() updateCourseInput: UpdateCourseInput) {
    return this.coursesService.update(updateCourseInput.id, updateCourseInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiOperation({ summary: 'Delete course' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}

function enrichTeacher(t: {
  firstName: string;
  middleName: string;
  fatherName: string;
  motherName: string;
  user?: { color?: string | null } | Record<string, unknown> | null;
}) {
  if (!t) return;
  const color =
    t.user && typeof t.user === 'object' && 'color' in t.user
      ? ((t.user as { color?: string | null }).color ?? null)
      : null;
  return {
    ...t,
    name: `${t.firstName} ${t.fatherName}`,
    fullName: `${t.firstName} ${t.middleName} ${t.fatherName} ${t.motherName}`,
    color,
    initials: `${t.firstName.charAt(0).toUpperCase()}${t.fatherName.charAt(0).toUpperCase()}`,
  };
}
