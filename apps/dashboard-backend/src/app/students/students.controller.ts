import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { FetchDataQueryDto } from '@/api-contracts';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { toFetchDataInput } from '../fetch-data-query.mapper';
import { GradesService } from '../grades/grades.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';

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

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_STUDENTS)
@Controller('v1/students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly gradesService: GradesService,
  ) {}

  @Get('count')
  @ApiOperation({ summary: 'Students count' })
  findManyStudentsCount(@Query() query: FetchDataQueryDto) {
    return this.studentsService.getCount(toFetchDataInput(query));
  }

  @Get('by-school/:schoolId')
  @ApiOperation({ summary: 'Students by school' })
  async findManyBySchoolId(@Param('schoolId') schoolId: string) {
    const list = await this.studentsService.findManyBySchoolId(schoolId);
    return list.map((s) => enrichStudent(s as Student));
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Students by course' })
  async findManyByCourseId(@Param('courseId') courseId: string) {
    const list = await this.studentsService.findManyByCourseId(courseId);
    return list.map((s) => enrichStudent(s as Student));
  }

  @Get()
  @ApiOperation({ summary: 'List students' })
  async findAll(@Query() query: FetchDataQueryDto) {
    const list = await this.studentsService.findAll(toFetchDataInput(query));
    return list.map((s) => enrichStudent(s as Student));
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Student grades (period optional)' })
  getStudentsGrades(@Param('id') id: string, @Query('periodId') periodId?: string) {
    return this.studentsService.getStudentsGrades(id, periodId);
  }

  @Get(':id/average-score')
  @ApiOperation({ summary: 'Average score for student in course/period' })
  getAverageScoreForStudent(
    @Param('id') id: string,
    @Query('courseId') courseId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.gradesService.getAverageScoreForStudent(courseId, periodId, id);
  }

  @Get(':id/enrollment-code')
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
  attachUser(
    @Param('id') id: string,
    @Body() body: { email: string; firstName?: string; lastName?: string },
  ) {
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
  async findOne(@Param('id') id: string) {
    const s = await this.studentsService.findOne(id);
    return enrichStudent(s as Student);
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
