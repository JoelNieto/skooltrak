import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateDegreeInput } from './dto/create-degree.input';
import { UpdateDegreeInput } from './dto/update-degree.input';
import { DegreesService } from './degrees.service';

@ApiTags('degrees')
@Controller('v1/degrees')
export class DegreesController {
  constructor(private readonly degreesService: DegreesService) {}

  @Post()
  @ApiOperation({ summary: 'Create degree' })
  create(@Body() createDegreeInput: CreateDegreeInput) {
    return this.degreesService.create(createDegreeInput);
  }

  @Get()
  @ApiOperation({ summary: 'List degrees' })
  findAll() {
    return this.degreesService.findAll();
  }

  @Get('by-school/count')
  @ApiOperation({ summary: 'Degrees count by school' })
  degreesBySchoolIdCount(@Query('schoolId') schoolId: string) {
    return this.degreesService.countBySchoolId(schoolId);
  }

  @Get('by-school')
  @ApiOperation({ summary: 'Degrees by school id' })
  findManyBySchoolId(
    @Query('schoolId') schoolId: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.degreesService.findManyBySchoolId(schoolId, {
      take: take != null ? Number(take) : undefined,
      skip: skip != null ? Number(skip) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get degree by id' })
  findOne(@Param('id') id: string) {
    return this.degreesService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update degree' })
  update(@Body() updateDegreeInput: UpdateDegreeInput) {
    return this.degreesService.update(updateDegreeInput.id, updateDegreeInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete degree' })
  remove(@Param('id') id: string) {
    return this.degreesService.remove(id);
  }
}
