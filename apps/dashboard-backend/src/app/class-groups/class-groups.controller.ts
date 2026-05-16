import { FetchDataQueryDto } from '@/api-contracts';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { toFetchDataInput } from '../fetch-data-query.mapper';
import { CreateClassGroupInput } from './dto/create-class-group.input';
import { UpdateClassGroupInput } from './dto/update-class-group.input';
import { ClassGroupsService } from './class-groups.service';

@ApiTags('class-groups')
@Controller('v1/class-groups')
export class ClassGroupsController {
  constructor(private readonly classGroupsService: ClassGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create class group' })
  create(@Body() createClassGroupInput: CreateClassGroupInput) {
    return this.classGroupsService.create(createClassGroupInput);
  }

  @Get()
  @ApiOperation({ summary: 'List class groups' })
  findAll(@Query() query: FetchDataQueryDto) {
    return this.classGroupsService.findAll(toFetchDataInput(query));
  }

  @Get('count')
  @ApiOperation({ summary: 'Class groups count' })
  count(@Query() query: FetchDataQueryDto) {
    return this.classGroupsService.count(toFetchDataInput(query));
  }

  @Get('by-organization/:organizationId')
  @ApiOperation({ summary: 'Class groups by organization' })
  findAllByOrganizationId(@Param('organizationId') organizationId: string) {
    return this.classGroupsService.findAllByOrganizationId(organizationId);
  }

  @Get('by-school/:schoolId')
  @ApiOperation({ summary: 'Class groups by school' })
  findAllBySchoolId(@Param('schoolId') schoolId: string) {
    return this.classGroupsService.findAllBySchoolId(schoolId);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Class groups by course' })
  findAllByCourseId(@Param('courseId') courseId: string) {
    return this.classGroupsService.findAllByCourseId(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class group by id' })
  findOne(@Param('id') id: string) {
    return this.classGroupsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update class group' })
  update(@Body() updateClassGroupInput: UpdateClassGroupInput) {
    return this.classGroupsService.update(updateClassGroupInput.id, updateClassGroupInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete class group' })
  remove(@Param('id') id: string) {
    return this.classGroupsService.remove(id);
  }
}
