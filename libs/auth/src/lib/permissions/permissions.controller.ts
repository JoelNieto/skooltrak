import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FetchDataQueryDto } from '@/api-contracts';
import { BetterAuthGuard, PermissionsGuard, RequirePermissions } from '../auth.guard';
import { FetchDataInput } from '../fetch-data-input';
import { Perm } from './permissions.constants';
import { CreatePermissionInput } from './dto/create-permission.input';
import { UpdatePermissionInput } from './dto/update-permission.input';
import { PermissionsService } from './permissions.service';

function toFetchDataInput(q: FetchDataQueryDto): FetchDataInput {
  return {
    skip: q.skip,
    take: q.take,
    orderBy: q.orderBy ?? 'name',
    orderDirection: q.orderDirection ?? 'asc',
    schoolId: q.schoolId,
    studyPlanId: q.studyPlanId,
    search: q.search ?? '',
  };
}

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@Controller('v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_PERMISSIONS)
  @ApiOperation({ summary: 'Create permission' })
  create(@Body() createPermissionInput: CreatePermissionInput) {
    return this.permissionsService.create(createPermissionInput);
  }

  @Get()
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'List permissions' })
  findAll(@Query() query: FetchDataQueryDto) {
    return this.permissionsService.findAll(toFetchDataInput(query));
  }

  @Get('count')
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Permissions count' })
  count(@Query() query: FetchDataQueryDto) {
    return this.permissionsService.count(toFetchDataInput(query));
  }

  @Get(':id')
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Get permission by id' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_PERMISSIONS)
  @ApiOperation({ summary: 'Update permission' })
  update(@Body() updatePermissionInput: UpdatePermissionInput) {
    return this.permissionsService.update(updatePermissionInput.id, updatePermissionInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_PERMISSIONS)
  @ApiOperation({ summary: 'Delete permission' })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
