import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStudentGradeInput } from './dto/create-student-grade.input';
import { UpdateStudentGradeInput } from './dto/update-student-grade.input';
import { StudentGradesService } from './student-grades.service';

@ApiTags('student-grades')
@Controller('v1/student-grades')
export class StudentGradesController {
  constructor(private readonly studentGradesService: StudentGradesService) {}

  @Post()
  @ApiOperation({ summary: 'Create student grade' })
  create(@Body() createStudentGradeInput: CreateStudentGradeInput) {
    return this.studentGradesService.create(createStudentGradeInput);
  }

  @Get()
  @ApiOperation({ summary: 'List student grades' })
  findAll() {
    return this.studentGradesService.findAll();
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Student grades by course' })
  findByCourseId(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.studentGradesService.findByCourseId(courseId, periodId, studentId);
  }

  @Get('average')
  @ApiOperation({ summary: 'Average course score for student' })
  averageCourseScoreForStudent(
    @Query('studentId') studentId: string,
    @Query('courseId') courseId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.studentGradesService.getAverageScoreForStudent(courseId, periodId, studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student grade by id' })
  findOne(@Param('id') id: string) {
    return this.studentGradesService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update student grade' })
  update(@Body() updateStudentGradeInput: UpdateStudentGradeInput) {
    return this.studentGradesService.update(updateStudentGradeInput.id, updateStudentGradeInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete student grade' })
  remove(@Param('id') id: string) {
    return this.studentGradesService.remove(id);
  }
}
