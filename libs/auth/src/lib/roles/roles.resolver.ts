import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BetterAuthGuard, PermissionsGuard, RequirePermissions } from '../auth.guard';
import { Perm } from '../permissions/permissions.constants';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@Resolver(() => Role)
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Mutation(() => Role)
  createRole(@Args('createRoleInput') createRoleInput: CreateRoleInput) {
    return this.rolesService.create(createRoleInput);
  }

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Query(() => [Role], { name: 'roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Query(() => Role, { name: 'role' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.rolesService.findOne(id);
  }

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Mutation(() => Role)
  updateRole(@Args('updateRoleInput') updateRoleInput: UpdateRoleInput) {
    return this.rolesService.update(updateRoleInput.id, updateRoleInput);
  }

  @RequirePermissions(Perm.MANAGE_ROLES)
  @Mutation(() => Role)
  removeRole(@Args('id', { type: () => String }) id: string) {
    return this.rolesService.remove(id);
  }
}
