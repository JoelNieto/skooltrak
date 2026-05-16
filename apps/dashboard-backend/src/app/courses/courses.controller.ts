import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { FetchDataQueryDto } from '@/api-contracts';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toFetchDataInput } from '../fetch-data-query.mapper';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_COURSES)
@Controller('v1/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_COURSES)
  @ApiOperation({ summary: 'Create course' })
  create(@Body() createCourseInput: CreateCourseInput) {
    return this.coursesService.create(createCourseInput);
  }

  @Get()
  @ApiOperation({ summary: 'List courses' })
  findAll(@Query() query: FetchDataQueryDto) {
    return this.coursesService.findAll(toFetchDataInput(query));
  }

  @Get('count')
  @ApiOperation({ summary: 'Courses count' })
  count(@Query() query: FetchDataQueryDto) {
    return this.coursesService.count(toFetchDataInput(query));
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

  @Get(':id')
  @ApiOperation({ summary: 'Get course by id' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
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
