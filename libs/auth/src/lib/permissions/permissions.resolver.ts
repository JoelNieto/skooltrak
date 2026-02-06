import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BetterAuthGuard, PermissionsGuard, RequirePermissions } from '../auth.guard';
import { FetchDataInput } from '../fetch-data-input';
import { CreatePermissionInput } from './dto/create-permission.input';
import { UpdatePermissionInput } from './dto/update-permission.input';
import { Permission } from './entities/permission.entity';
import { Perm } from './permissions.constants';
import { PermissionsService } from './permissions.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@Resolver(() => Permission)
export class PermissionsResolver {
  constructor(private readonly permissionsService: PermissionsService) {}

  @RequirePermissions(Perm.MANAGE_PERMISSIONS)
  @Mutation(() => Permission)
  createPermission(@Args('createPermissionInput') createPermissionInput: CreatePermissionInput) {
    return this.permissionsService.create(createPermissionInput);
  }

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Query(() => [Permission], { name: 'permissions' })
  findAll(@Args() fetchDataInput: FetchDataInput) {
    return this.permissionsService.findAll(fetchDataInput);
  }

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Query(() => Int, { name: 'permissionsCount' })
  count(@Args() fetchDataInput: FetchDataInput) {
    return this.permissionsService.count(fetchDataInput);
  }

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Query(() => Permission, { name: 'permission' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.permissionsService.findOne(id);
  }

  @RequirePermissions(Perm.MANAGE_PERMISSIONS)
  @Mutation(() => Permission)
  updatePermission(@Args('updatePermissionInput') updatePermissionInput: UpdatePermissionInput) {
    return this.permissionsService.update(updatePermissionInput.id, updatePermissionInput);
  }

  @RequirePermissions(Perm.MANAGE_PERMISSIONS)
  @Mutation(() => Permission)
  removePermission(@Args('id', { type: () => String }) id: string) {
    return this.permissionsService.remove(id);
  }
}
