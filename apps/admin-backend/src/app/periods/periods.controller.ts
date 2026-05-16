import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePeriodInput } from './dto/create-period.input';
import { UpdatePeriodInput } from './dto/update-period.input';
import { PeriodsService } from './periods.service';

@ApiTags('periods')
@Controller('v1/periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Post()
  @ApiOperation({ summary: 'Create period' })
  create(@Body() createPeriodInput: CreatePeriodInput) {
    return this.periodsService.create(createPeriodInput);
  }

  @Get()
  @ApiOperation({ summary: 'List periods' })
  findAll() {
    return this.periodsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get period by id' })
  findOne(@Param('id') id: string) {
    return this.periodsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update period' })
  update(@Body() updatePeriodInput: UpdatePeriodInput) {
    return this.periodsService.update(updatePeriodInput.id, updatePeriodInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete period' })
  remove(@Param('id') id: string) {
    return this.periodsService.remove(id);
  }
}
