import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HabitMetricsService } from './habit-metrics.service';

@ApiTags('habit-metrics')
@Controller('v1/habit-metrics')
export class HabitMetricsController {
  constructor(private readonly habitMetricsService: HabitMetricsService) {}

  @Get()
  @ApiOperation({ summary: 'List habit metrics' })
  findAll() {
    return this.habitMetricsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get habit metric by id' })
  findOne(@Param('id') id: string) {
    return this.habitMetricsService.findOne(id);
  }
}
