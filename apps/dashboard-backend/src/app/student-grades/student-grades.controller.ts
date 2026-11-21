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
import { canSeeStudent, GradeAccessService, MOVE_DENIED, READ_DENIED } from '../grades/grade-access.service';
import { CreateStudentGradeInput } from './dto/create-student-grade.input';
import { UpdateStudentGradeInput } from './dto/update-student-grade.input';
import { StudentGradesService } from './student-grades.service';

/**
 * One student's score in a grade column. Reads need VIEW_GRADES and are limited to the caller's
 * own, linked or homeroom students (published only); writes need MANAGE_GRADES on the course
 * (ASM-001-S01, BR-ASM-001.13).
 */
@ApiTags('student-grades')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_GRADES)
@Controller('v1/student-grades')
export class StudentGradesController {
  constructor(
    private readonly studentGradesService: StudentGradesService,
    private readonly access: GradeAccessService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Create student grade' })
  async create(@Req() req: AuthenticatedRequest, @Body() createStudentGradeInput: CreateStudentGradeInput) {
    const grade = await this.access.gradeRef(createStudentGradeInput.gradeId);
    await this.access.assertCanWriteCourse(req.user, grade.courseId);
    await this.access.assertStudentEnrolled(grade.courseId, createStudentGradeInput.studentId);
    return this.studentGradesService.create(createStudentGradeInput, grade.published, req.user?.userId ?? null);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Published student grades by course' })
  async findByCourseId(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Query('periodId') periodId?: string,
    @Query('studentId') studentId?: string,
  ) {
    const scope = studentId
      ? await this.access.assertCanReadStudent(req.user, courseId, studentId)
      : await this.access.readScope(req.user, courseId);
    const rows = await this.studentGradesService.findByCourseId(courseId, periodId, studentId);
    return rows.filter((row) => canSeeStudent(scope, row.studentId));
  }

  @Get('average')
  @ApiOperation({ summary: 'Average course score for student' })
  async averageCourseScoreForStudent(
    @Req() req: AuthenticatedRequest,
    @Query('studentId') studentId: string,
    @Query('courseId') courseId: string,
    @Query('periodId') periodId: string,
  ) {
    if (!studentId || !courseId) throw new BadRequestException('studentId and courseId are required');
    await this.access.assertCanReadStudent(req.user, courseId, studentId);
    return this.studentGradesService.getAverageScoreForStudent(courseId, periodId, studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student grade by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const ref = await this.access.studentGradeRef(id);
    const scope = await this.access.assertCanReadStudent(req.user, ref.grade.courseId, ref.studentId);
    if (!scope.staff && !ref.grade.published) throw new ForbiddenException(READ_DENIED);
    return this.studentGradesService.findOne(id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Update student grade' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateStudentGradeInput: UpdateStudentGradeInput) {
    const ref = await this.access.studentGradeRef(updateStudentGradeInput.id);
    await this.access.assertCanWriteCourse(req.user, ref.grade.courseId);
    const { gradeId, studentId } = updateStudentGradeInput;
    if ((gradeId && gradeId !== ref.gradeId) || (studentId && studentId !== ref.studentId)) {
      throw new BadRequestException(MOVE_DENIED);
    }
    return this.studentGradesService.update(ref.id, updateStudentGradeInput, ref.grade.published, req.user?.userId ?? null);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Delete student grade' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const ref = await this.access.studentGradeRef(id);
    await this.access.assertCanWriteCourse(req.user, ref.grade.courseId);
    return this.studentGradesService.remove(ref.id);
  }
}
