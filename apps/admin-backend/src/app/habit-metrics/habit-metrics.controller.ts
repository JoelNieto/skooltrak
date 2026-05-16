import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateHabitMetricInput } from './dto/create-habit-metric.input';
import { UpdateHabitMetricInput } from './dto/update-habit-metric.input';
import { HabitMetricsService } from './habit-metrics.service';

@ApiTags('habit-metrics')
@Controller('v1/habit-metrics')
export class HabitMetricsController {
  constructor(private readonly habitMetricsService: HabitMetricsService) {}

  @Post()
  @ApiOperation({ summary: 'Create habit metric' })
  create(@Body() createHabitMetricInput: CreateHabitMetricInput) {
    return this.habitMetricsService.create(createHabitMetricInput);
  }

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

  @Patch()
  @ApiOperation({ summary: 'Update habit metric' })
  update(@Body() updateHabitMetricInput: UpdateHabitMetricInput) {
    return this.habitMetricsService.update(updateHabitMetricInput.id, updateHabitMetricInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete habit metric' })
  remove(@Param('id') id: string) {
    return this.habitMetricsService.remove(id);
  }
}
