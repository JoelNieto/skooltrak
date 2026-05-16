import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStudyPlanInput } from './dto/create-study-plan.input';
import { UpdateStudyPlanInput } from './dto/update-study-plan.input';
import { StudyPlansService } from './study-plans.service';

@ApiTags('study-plans')
@Controller('v1/study-plans')
export class StudyPlansController {
  constructor(private readonly studyPlansService: StudyPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create study plan' })
  create(@Body() createStudyPlanInput: CreateStudyPlanInput) {
    return this.studyPlansService.create(createStudyPlanInput);
  }

  @Get()
  @ApiOperation({ summary: 'List study plans' })
  findAll() {
    return this.studyPlansService.findAll();
  }

  @Get('by-school')
  @ApiOperation({ summary: 'Study plans by school (optional degreeId)' })
  findAllBySchoolId(@Query('schoolId') schoolId: string, @Query('degreeId') degreeId?: string) {
    return this.studyPlansService.findAllBySchoolId(schoolId, degreeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get study plan by id' })
  findOne(@Param('id') id: string) {
    return this.studyPlansService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update study plan' })
  update(@Body() updateStudyPlanInput: UpdateStudyPlanInput) {
    return this.studyPlansService.update(updateStudyPlanInput.id, updateStudyPlanInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete study plan' })
  remove(@Param('id') id: string) {
    return this.studyPlansService.remove(id);
  }
}
