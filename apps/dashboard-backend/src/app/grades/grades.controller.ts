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
import { CoursesService } from '../courses/courses.service';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { GradeAccessService, MOVE_DENIED, READ_DENIED, scopeGrade } from './grade-access.service';
import { GradesService } from './grades.service';

/**
 * Grade columns. Reads need VIEW_GRADES, writes MANAGE_GRADES, and every handler checks the
 * caller against the grade's course (ASM-001-S01, BR-ASM-001.13).
 */
@ApiTags('grades')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_GRADES)
@Controller('v1/grades')
export class GradesController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly coursesService: CoursesService,
    private readonly access: GradeAccessService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Create grade' })
  async create(@Req() req: AuthenticatedRequest, @Body() createGradeInput: CreateGradeInput) {
    await this.access.assertCanWriteCourse(req.user, createGradeInput.courseId);
    await this.access.assertBucketInCourse(createGradeInput.bucketId, createGradeInput.courseId);
    return this.gradesService.create(createGradeInput);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Grades by course (optional period)' })
  async findByCourseId(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Query('periodId') periodId?: string,
  ) {
    const scope = await this.access.readScope(req.user, courseId);
    const grades = await this.gradesService.findByCourseId(courseId, periodId);
    return grades.map((grade) => scopeGrade(grade, scope)).filter((grade) => grade !== null);
  }

  @Get(':id/with-course')
  @ApiOperation({ summary: 'Get grade with course resolved' })
  async findOneWithCourse(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const grade = await this.readOne(req, id);
    if (grade.course && typeof grade.course === 'object' && 'id' in grade.course) {
      return grade;
    }
    const course = await this.coursesService.findOne(grade.courseId);
    return { ...grade, course };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grade by id' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.readOne(req, id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Update grade (only admins can unpublish)' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateGradeInput: UpdateGradeInput) {
    const existing = await this.access.gradeRef(updateGradeInput.id);
    await this.access.assertCanWriteCourse(req.user, existing.courseId);
    if (updateGradeInput.courseId && updateGradeInput.courseId !== existing.courseId) {
      throw new BadRequestException(MOVE_DENIED);
    }
    if (updateGradeInput.bucketId) {
      await this.access.assertBucketInCourse(updateGradeInput.bucketId, existing.courseId);
    }
    this.access.assertCanChangePublished(req.user, existing.published, updateGradeInput.published);
    return this.gradesService.update(existing.id, updateGradeInput, req.user?.userId ?? null);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Delete grade' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const existing = await this.access.gradeRef(id);
    await this.access.assertCanWriteCourse(req.user, existing.courseId);
    return this.gradesService.remove(existing.id);
  }

  /** A grade trimmed to what the caller may see; drafts are refused to non-staff. */
  private async readOne(req: AuthenticatedRequest, id: string) {
    const ref = await this.access.gradeRef(id);
    const scope = await this.access.readScope(req.user, ref.courseId);
    const grade = await this.gradesService.findOne(id);
    const scoped = grade ? scopeGrade(grade, scope) : null;
    if (!scoped) throw new ForbiddenException(READ_DENIED);
    return scoped;
  }
}
