import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Parent as GqlParent, Int, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateParentInput } from './dto/create-parent.input';
import { UpdateParentInput } from './dto/update-parent.input';
import { Parent } from './entities/parent.entity';
import { ParentsService } from './parents.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_PARENTS)
@Resolver(() => Parent)
export class ParentsResolver {
  constructor(private readonly parentsService: ParentsService) {}

  @RequirePermissions(Perm.MANAGE_PARENTS)
  @Mutation(() => Parent)
  createParent(@Args('createParentInput') createParentInput: CreateParentInput) {
    return this.parentsService.create(createParentInput);
  }

  @Query(() => [Parent], { name: 'parents' })
  findAll(@Args() fetchDataInput: FetchDataInput) {
    return this.parentsService.findAll(fetchDataInput);
  }

  @Query(() => Int, { name: 'parentsCount' })
  getCount(@Args() fetchDataInput: FetchDataInput) {
    return this.parentsService.getCount(fetchDataInput);
  }

  @Query(() => Parent, { name: 'parent' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.parentsService.findOne(id);
  }

  @Query(() => [Parent], { name: 'parentsByStudentId' })
  findByStudentId(@Args('studentId', { type: () => String }) studentId: string) {
    return this.parentsService.findByStudentId(studentId);
  }

  @ResolveField(() => String)
  name(@GqlParent() parent: Parent) {
    return `${parent.firstName} ${parent.fatherName}`;
  }

  @ResolveField(() => String)
  fullName(@GqlParent() parent: Parent) {
    const parts = [parent.firstName, parent.middleName, parent.fatherName, parent.motherName].filter(Boolean);
    return parts.join(' ');
  }

  @RequirePermissions(Perm.MANAGE_PARENTS)
  @Mutation(() => Parent)
  updateParent(@Args('updateParentInput') updateParentInput: UpdateParentInput) {
    return this.parentsService.update(updateParentInput.id, updateParentInput);
  }

  @RequirePermissions(Perm.MANAGE_PARENTS)
  @Mutation(() => Parent)
  removeParent(@Args('id', { type: () => String }) id: string) {
    return this.parentsService.remove(id);
  }
}
