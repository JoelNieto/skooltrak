import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BetterAuthGuard, PermissionsGuard, RequirePermissions } from '../auth.guard';
import { Perm } from '../permissions/permissions.constants';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@Controller('v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Create role' })
  create(@Body() createRoleInput: CreateRoleInput) {
    return this.rolesService.create(createRoleInput);
  }

  @Get()
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'List roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Get role by id' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Update role' })
  update(@Body() updateRoleInput: UpdateRoleInput) {
    return this.rolesService.update(updateRoleInput.id, updateRoleInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
