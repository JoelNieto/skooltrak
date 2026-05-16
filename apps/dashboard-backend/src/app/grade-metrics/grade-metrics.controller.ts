import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradeMetricsService } from './grade-metrics.service';

@ApiTags('grade-metrics')
@Controller('v1/grade-metrics')
export class GradeMetricsController {
  constructor(private readonly gradeMetricsService: GradeMetricsService) {}

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
}
