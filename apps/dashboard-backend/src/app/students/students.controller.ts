import { FetchDataQueryDto } from '@/api-contracts';
import { AuthenticatedRequest, AuthUserContext, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { canSeeStudent, GradeAccessService, READ_DENIED } from '../grades/grade-access.service';
import { GradesService } from '../grades/grades.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';
import { Student } from './entities/student.entity';
import { isStudentStaff, STUDENT_DENIED, StudentsService } from './students.service';

/** Lists of students are for staff of the organization (see `isStudentStaff`). */
function assertStaff(user: AuthUserContext | undefined): void {
  if (!isStudentStaff(user)) throw new ForbiddenException(STUDENT_DENIED);
}

function enrichStudent(s: Student) {
  return {
    ...s,
    initials: `${s.firstName.charAt(0)}${s.fatherName.charAt(0)}`,
    name: `${s.firstName} ${s.fatherName}`,
    fullName: `${s.firstName} ${s.middleName} ${s.fatherName} ${s.motherName}`,
    email: s.user?.email,
    color: s.user?.color,
  };
}

/** Admins (and any role granted MANAGE_STUDENTS) may see parent-linking enrollment codes. */
function canManageStudents(user: AuthUserContext | undefined): boolean {
  const role = user?.role?.toUpperCase();
  return role === 'ORG_ADMIN' || role === 'ADMIN' || role === 'SYSADMIN' || !!user?.permissions?.includes(Perm.MANAGE_STUDENTS);
}

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_STUDENTS)
@Controller('v1/students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly gradesService: GradesService,
    private readonly gradeAccess: GradeAccessService,
  ) {}

  @Get('count')
  @ApiOperation({ summary: 'Students count' })
  async findManyStudentsCount(@Req() req: AuthenticatedRequest, @Query() query: FetchDataQueryDto) {
    assertStaff(req.user);
    return this.studentsService.getCount(query);
  }

  @Get('by-school/:schoolId')
  @ApiOperation({ summary: 'Students by school' })
  async findManyBySchoolId(@Req() req: AuthenticatedRequest, @Param('schoolId') schoolId: string) {
    assertStaff(req.user);
    const list = await this.studentsService.findManyBySchoolId(schoolId);
    return list.map((s) => enrichStudent(s as Student));
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Students by course' })
  async findManyByCourseId(@Req() req: AuthenticatedRequest, @Param('courseId') courseId: string) {
    // Same rule as the course's grades: staff see the roster, others only the students they may see.
    const scope = await this.gradeAccess.readScope(req.user, courseId);
    const list = await this.studentsService.findManyByCourseId(courseId);
    return list.filter((s) => canSeeStudent(scope, s.id)).map((s) => enrichStudent(s as Student));
  }

  @Get('by-group/:groupId')
  @ApiOperation({ summary: 'Students by class group' })
  async findManyByClassGroupId(@Req() req: AuthenticatedRequest, @Param('groupId') groupId: string) {
    assertStaff(req.user);
    const list = await this.studentsService.findManyByClassGroupId(groupId);
    return list.map((s) => enrichStudent(s as Student));
  }

  @Get()
  @ApiOperation({ summary: 'List students' })
  async findAll(@Req() req: AuthenticatedRequest, @Query() query: FetchDataQueryDto) {
    assertStaff(req.user);
    const resp = await this.studentsService.findAll(query);
    return { ...resp, data: resp.data.map((s) => enrichStudent(s as Student)) };
  }

  @Get(':id/grades')
  @RequirePermissions(Perm.VIEW_GRADES)
  @ApiOperation({ summary: "Student's published grades by course (period optional)" })
  async getStudentsGrades(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('periodId') periodId?: string,
  ) {
    // Self, linked parent, homeroom teacher or admin: every course; other teachers: their courses only.
    const scope = await this.gradeAccess.studentCoursesScope(req.user, id);
    const courses = await this.studentsService.getStudentsGrades(id, periodId);
    if (scope === 'all') return courses;
    const visible = courses.filter((course) => scope.has(course.id));
    if (!visible.length) throw new ForbiddenException(READ_DENIED);
    return visible;
  }

  @Get(':id/average-score')
  @ApiOperation({ summary: 'Average score for student in course/period' })
  @RequirePermissions(Perm.VIEW_GRADES)
  async getAverageScoreForStudent(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('courseId') courseId: string,
    @Query('periodId') periodId: string,
  ) {
    if (!courseId) throw new BadRequestException('courseId is required');
    await this.gradeAccess.assertCanReadStudent(req.user, courseId, id);
    return this.gradesService.getAverageScoreForStudent(courseId, periodId, id);
  }

  @Get(':id/enrollment-code')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Get student enrollment code for parent self-linking' })
  getEnrollmentCode(@Param('id') id: string) {
    return this.studentsService.getEnrollmentCode(id);
  }

  @Post(':id/enrollment-code/regenerate')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Regenerate (revoke) student enrollment code' })
  regenerateEnrollmentCode(@Param('id') id: string) {
    return this.studentsService.regenerateEnrollmentCode(id);
  }

  @Get(':id/connect-token.png')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Printable QR child-connect token (PNG) for welcome letters' })
  async connectTokenQr(@Param('id') id: string, @Res() res: Response) {
    const { png } = await this.studentsService.getConnectTokenQrPng(id);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="connect-${id}.png"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(png);
  }

  @Post(':id/attach-user')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Upgrade a profile-only student into an account with magic-link access' })
  attachUser(@Param('id') id: string, @Body() body: { email: string; firstName?: string; lastName?: string }) {
    return this.studentsService.attachUser(id, body);
  }

  @Post()
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Create student' })
  create(@Body() createStudentInput: CreateStudentInput) {
    return this.studentsService.create(createStudentInput).then((s) => enrichStudent(s as Student));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.studentsService.assertCanRead(id);
    const s = enrichStudent((await this.studentsService.findOne(id)) as Student);
    // The enrollment code is omitted from every query by default (prisma.service.ts); admins of the
    // student's organization get it back for the student page.
    if (!canManageStudents(req.user) || s.organizationId !== req.user?.organizationId) return s;
    const { enrollmentCode, enrollmentCodeGeneratedAt } = await this.studentsService.getEnrollmentCode(id);
    return { ...s, enrollmentCode, enrollmentCodeGeneratedAt };
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Update student' })
  update(@Body() updateStudentInput: UpdateStudentInput) {
    return this.studentsService
      .update(updateStudentInput.id, updateStudentInput)
      .then((s) => enrichStudent(s as Student));
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Delete student' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
