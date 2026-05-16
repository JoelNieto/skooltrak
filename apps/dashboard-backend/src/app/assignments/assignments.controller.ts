import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';

@ApiTags('assignments')
@Controller('v1/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create assignment' })
  create(@Body() createAssignmentInput: CreateAssignmentInput) {
    return this.assignmentsService.create(createAssignmentInput);
  }

  @Get()
  @ApiOperation({ summary: 'List assignments' })
  findAll() {
    return this.assignmentsService.findAll();
  }

  @Get('by-school')
  @ApiOperation({ summary: 'Assignments by school and date range' })
  findAssignmentBySchoolId(
    @Query('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.assignmentsService.findAssignmentBySchoolId(schoolId, new Date(startDate), new Date(endDate));
  }

  @Get('by-course')
  @ApiOperation({ summary: 'Assignments by course and date range' })
  findAssignmentByCourseId(
    @Query('courseId') courseId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.assignmentsService.findAssignmentByCourseId(courseId, new Date(startDate), new Date(endDate));
  }

  @Get('dates/by-school')
  @ApiOperation({ summary: 'Assignment dates by school' })
  findAssignmentDatesBySchoolId(
    @Query('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('classGroupId') classGroupId?: string,
  ) {
    return this.assignmentsService.findAssignmentDatesBySchoolId(
      schoolId,
      new Date(startDate),
      new Date(endDate),
      classGroupId,
    );
  }

  @Get('dates/by-course')
  @ApiOperation({ summary: 'Assignment dates by course' })
  findAssignmentDatesByCourseId(
    @Query('courseId') courseId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('classGroupId') classGroupId?: string,
  ) {
    return this.assignmentsService.findAssignmentDatesByCourseId(
      courseId,
      new Date(startDate),
      new Date(endDate),
      classGroupId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by id' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update assignment' })
  update(@Body() updateAssignmentInput: UpdateAssignmentInput) {
    return this.assignmentsService.update(updateAssignmentInput.id, updateAssignmentInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assignment' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }
}
