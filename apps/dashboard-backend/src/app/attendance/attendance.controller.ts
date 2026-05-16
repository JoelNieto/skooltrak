import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { AttendanceFilterInput } from './dto/attendance-filter.input';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';

function filterFromQuery(q: Record<string, string | undefined>): AttendanceFilterInput {
  return {
    courseId: q['courseId']!,
    classGroupId: q['classGroupId'],
    startDate: q['startDate'] ? new Date(q['startDate']) : undefined,
    endDate: q['endDate'] ? new Date(q['endDate']) : undefined,
    skip: q['skip'] != null ? Number(q['skip']) : undefined,
    take: q['take'] != null ? Number(q['take']) : undefined,
  };
}

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_ATTENDANCE)
@Controller('v1/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('sessions')
  @RequirePermissions(Perm.MANAGE_ATTENDANCE)
  @ApiOperation({ summary: 'Create attendance session' })
  create(@Body() input: CreateAttendanceSessionInput) {
    return this.attendanceService.create(input);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List attendance sessions' })
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.attendanceService.findAll(filterFromQuery(query));
  }

  @Get('sessions/count')
  @ApiOperation({ summary: 'Attendance sessions count' })
  count(@Query() query: Record<string, string | undefined>) {
    return this.attendanceService.count(filterFromQuery(query));
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get attendance session' })
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Patch('records')
  @RequirePermissions(Perm.MANAGE_ATTENDANCE)
  @ApiOperation({ summary: 'Update one attendance record' })
  updateRecord(@Body() input: UpdateAttendanceRecordInput) {
    return this.attendanceService.updateRecord(input);
  }

  @Patch('records/batch')
  @RequirePermissions(Perm.MANAGE_ATTENDANCE)
  @ApiOperation({ summary: 'Update many attendance records' })
  updateManyRecords(@Body() body: { inputs: UpdateAttendanceRecordInput[] }) {
    return this.attendanceService.updateManyRecords(body.inputs);
  }

  @Delete('sessions/:id')
  @RequirePermissions(Perm.MANAGE_ATTENDANCE)
  @ApiOperation({ summary: 'Delete attendance session' })
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }

  @Get('students')
  @ApiOperation({ summary: 'Students for attendance (course + class group)' })
  getStudentsForAttendance(@Query('courseId') courseId: string, @Query('classGroupId') classGroupId: string) {
    return this.attendanceService.getStudentsForAttendance(courseId, classGroupId);
  }

  @Get('records/by-student/:studentId')
  @ApiOperation({ summary: 'Attendance records by student' })
  getAttendanceByStudentId(@Param('studentId') studentId: string, @Query('take') take?: string) {
    return this.attendanceService.getAttendanceByStudentId(studentId, take != null ? Number(take) : undefined);
  }

  @Get('stats/by-student/:studentId')
  @ApiOperation({ summary: 'Student attendance stats' })
  getStudentAttendanceStats(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAttendanceStats(studentId);
  }
}
