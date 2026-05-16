import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGradeMetricInput } from './dto/create-grade-metric.input';
import { UpdateGradeMetricInput } from './dto/update-grade-metric.input';
import { GradeMetricsService } from './grade-metrics.service';

@ApiTags('grade-metrics')
@Controller('v1/grade-metrics')
export class GradeMetricsController {
  constructor(private readonly gradeMetricsService: GradeMetricsService) {}

  @Post()
  @ApiOperation({ summary: 'Create grade metric' })
  create(@Body() createGradeMetricInput: CreateGradeMetricInput) {
    return this.gradeMetricsService.create(createGradeMetricInput);
  }

  @Get()
  @ApiOperation({ summary: 'List grade metrics' })
  findAll() {
    return this.gradeMetricsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grade metric by id' })
  findOne(@Param('id') id: string) {
    return this.gradeMetricsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update grade metric' })
  update(@Body() updateGradeMetricInput: UpdateGradeMetricInput) {
    return this.gradeMetricsService.update(updateGradeMetricInput.id, updateGradeMetricInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete grade metric' })
  remove(@Param('id') id: string) {
    return this.gradeMetricsService.remove(id);
  }
}
