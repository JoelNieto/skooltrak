import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { FetchDataQueryDto } from '@/api-contracts';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toFetchDataInput } from '../fetch-data-query.mapper';
import { CreateParentInput } from './dto/create-parent.input';
import { UpdateParentInput } from './dto/update-parent.input';
import { Parent } from './entities/parent.entity';
import { ParentsService } from './parents.service';

function enrichParent(p: Parent) {
  const parts = [p.firstName, p.middleName, p.fatherName, p.motherName].filter(Boolean);
  return {
    ...p,
    name: `${p.firstName} ${p.fatherName}`,
    fullName: parts.join(' '),
  };
}

@ApiTags('parents')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_PARENTS)
@Controller('v1/parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_PARENTS)
  @ApiOperation({ summary: 'Create parent' })
  create(@Body() createParentInput: CreateParentInput) {
    return this.parentsService.create(createParentInput).then((p) => enrichParent(p as Parent));
  }

  @Get('count')
  @ApiOperation({ summary: 'Parents count' })
  getCount(@Query() query: FetchDataQueryDto) {
    return this.parentsService.getCount(toFetchDataInput(query));
  }

  @Get('by-student/:studentId')
  @ApiOperation({ summary: 'Parents by student id' })
  async findByStudentId(@Param('studentId') studentId: string) {
    const list = await this.parentsService.findByStudentId(studentId);
    return list.map((p) => enrichParent(p as Parent));
  }

  @Get()
  @ApiOperation({ summary: 'List parents' })
  async findAll(@Query() query: FetchDataQueryDto) {
    const list = await this.parentsService.findAll(toFetchDataInput(query));
    return list.map((p) => enrichParent(p as Parent));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get parent by id' })
  async findOne(@Param('id') id: string) {
    const p = await this.parentsService.findOne(id);
    return enrichParent(p as Parent);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_PARENTS)
  @ApiOperation({ summary: 'Update parent' })
  update(@Body() updateParentInput: UpdateParentInput) {
    return this.parentsService
      .update(updateParentInput.id, updateParentInput)
      .then((p) => enrichParent(p as Parent));
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_PARENTS)
  @ApiOperation({ summary: 'Delete parent' })
  remove(@Param('id') id: string) {
    return this.parentsService.remove(id);
  }
}
