import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FetchDataQueryDto } from '@/api-contracts';
import { FetchDataInput } from '../fetch-data.input';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { SchoolsService } from './schools.service';

function toFetchDataInput(q: FetchDataQueryDto): FetchDataInput {
  return {
    skip: q.skip,
    take: q.take,
    orderBy: q.orderBy ?? 'name',
    orderDirection: q.orderDirection ?? 'asc',
    organizationId: q.organizationId,
    schoolId: q.schoolId,
    studyPlanId: q.studyPlanId,
    search: q.search ?? '',
  };
}

@ApiTags('schools')
@Controller('v1/schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @ApiOperation({ summary: 'Create school' })
  create(@Body() createSchoolInput: CreateSchoolInput) {
    return this.schoolsService.create(createSchoolInput);
  }

  @Get()
  @ApiOperation({ summary: 'List schools' })
  findAll(@Query() query: FetchDataQueryDto) {
    return this.schoolsService.findAll(toFetchDataInput(query));
  }

  @Get('count')
  @ApiOperation({ summary: 'Schools count' })
  count(@Query() query: FetchDataQueryDto) {
    return this.schoolsService.count(toFetchDataInput(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get school by id' })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update school' })
  update(@Body() updateSchoolInput: UpdateSchoolInput) {
    return this.schoolsService.update(updateSchoolInput.id, updateSchoolInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete school' })
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}
