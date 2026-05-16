import { BetterAuthGuard } from '@/auth';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SaveHabitEvaluationInput } from './dto/save-habit-evaluation.input';
import { HabitEvaluationsService } from './habit-evaluations.service';

@ApiTags('habit-evaluations')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('v1/habit-evaluations')
export class HabitEvaluationsController {
  constructor(private readonly habitEvaluationsService: HabitEvaluationsService) {}

  @Post()
  @ApiOperation({ summary: 'Save habit evaluation' })
  saveHabitEvaluation(@Body() saveHabitEvaluationInput: SaveHabitEvaluationInput) {
    return this.habitEvaluationsService.save(saveHabitEvaluationInput);
  }

  @Get('by-group')
  @ApiOperation({ summary: 'Habit evaluations by class group and period' })
  findByGroup(@Query('classGroupId') classGroupId: string, @Query('periodId') periodId: string) {
    return this.habitEvaluationsService.findByGroup(classGroupId, periodId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get habit evaluation by id' })
  findOne(@Param('id') id: string) {
    return this.habitEvaluationsService.findOne(id);
  }
}
