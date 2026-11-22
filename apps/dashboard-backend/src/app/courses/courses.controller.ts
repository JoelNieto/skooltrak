import { FetchDataQueryDto } from '@/api-contracts';
import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CourseAccessService } from './course-access.service';
import { CoursePageService } from './course-page.service';
import { CoursesMineService } from './courses-mine.service';
import { CourseWork } from './entities/course-page.entity';
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

    return { ...resp, data: resp.data.map((i) => ({ ...i, teacher: enrichTeacher(i.teacher) })) };
  }

  @Get('mine')
  @ApiOperation({ summary: "A student's (or a parent's linked child's) course cards and stats for one period (FR-ACA-001.4–.8)" })
  @ApiQuery({ name: 'periodId', required: false, description: 'Defaults to the current period' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Parents: a linked child (FR-ACA-001.8); ignored for students' })
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
