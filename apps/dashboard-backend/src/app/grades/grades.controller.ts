import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from '../courses/courses.service';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { GradesService } from './grades.service';

@ApiTags('grades')
@Controller('v1/grades')
export class GradesController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly coursesService: CoursesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create grade' })
  create(@Body() createGradeInput: CreateGradeInput) {
    return this.gradesService.create(createGradeInput);
  }

  @Get()
  @ApiOperation({ summary: 'List grades' })
  findAll() {
    return this.gradesService.findAll();
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Grades by course (optional period)' })
  findByCourseId(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.gradesService.findByCourseId(courseId, periodId);
  }

  @Get(':id/with-course')
  @ApiOperation({ summary: 'Get grade with course resolved' })
  async findOneWithCourse(@Param('id') id: string) {
    const grade = await this.gradesService.findOne(id);
    if (!grade) return null;
    if (grade.course && typeof grade.course === 'object' && 'id' in grade.course) {
      return grade;
    }
    if (!grade.courseId) throw new Error(`Grade ${grade.id} does not have a courseId`);
    const course = await this.coursesService.findOne(grade.courseId);
    return { ...grade, course };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grade by id' })
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update grade' })
  update(@Body() updateGradeInput: UpdateGradeInput) {
    return this.gradesService.update(updateGradeInput.id, updateGradeInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete grade' })
  remove(@Param('id') id: string) {
    return this.gradesService.remove(id);
  }
}
