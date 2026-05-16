import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FetchDataQueryDto } from '@/api-contracts';
import { toFetchDataInput } from '../fetch-data-query.mapper';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
import { SubjectsService } from './subjects.service';

@ApiTags('subjects')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_SUBJECTS)
@Controller('v1/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_SUBJECTS)
  @ApiOperation({ summary: 'Create subject' })
  create(@Body() createSubjectInput: CreateSubjectInput) {
    return this.subjectsService.create(createSubjectInput);
  }

  @Get()
  @ApiOperation({ summary: 'List subjects' })
  findAll(@Query() query: FetchDataQueryDto) {
    return this.subjectsService.findAll(toFetchDataInput(query));
  }

  @Get('count')
  @ApiOperation({ summary: 'Subjects count' })
  findManySubjectsCount(@Query() query: FetchDataQueryDto) {
    return this.subjectsService.findCount(toFetchDataInput(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by id' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_SUBJECTS)
  @ApiOperation({ summary: 'Update subject' })
  update(@Body() updateSubjectInput: UpdateSubjectInput) {
    return this.subjectsService.update(updateSubjectInput.id, updateSubjectInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_SUBJECTS)
  @ApiOperation({ summary: 'Delete subject' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
