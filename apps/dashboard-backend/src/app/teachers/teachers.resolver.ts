import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateTeacherInput } from './dto/create-teacher.input';
import { UpdateTeacherInput } from './dto/update-teacher.input';
import { Teacher } from './entities/teacher.entity';
import { TeachersService } from './teachers.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_TEACHERS)
@Resolver(() => Teacher)
export class TeachersResolver {
  constructor(private readonly teachersService: TeachersService) {}

  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @Mutation(() => Teacher)
  createTeacher(@Args('createTeacherInput') createTeacherInput: CreateTeacherInput) {
    return this.teachersService.create(createTeacherInput);
  }

  @Query(() => [Teacher], { name: 'teachers' })
  findAll(
    @Args()
    fetchDataInput: FetchDataInput,
  ) {
    return this.teachersService.findAll(fetchDataInput);
  }

  @Query(() => Teacher, { name: 'teacher' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.teachersService.findOne(id);
  }

  @Query(() => [Teacher], { name: 'teachersByOrganizationId' })
  findManyByOrganizationId(@Args('organizationId', { type: () => String }) organizationId: string) {
    return this.teachersService.findManyByOrganizationId(organizationId);
  }

  @Query(() => Int, { name: 'findManyTeachersCount' })
  findManyTeachersCount(
    @Args()
    fetchDataInput: FetchDataInput,
  ) {
    return this.teachersService.findCount(fetchDataInput);
  }

  @ResolveField(() => String)
  name(@Parent() teacher: Teacher) {
    return `${teacher.firstName} ${teacher.fatherName}`;
  }

  @ResolveField(() => String)
  fullName(@Parent() teacher: Teacher) {
    return `${teacher.firstName} ${teacher.middleName} ${teacher.fatherName} ${teacher.motherName}`;
  }

  @ResolveField(() => String, { nullable: true })
  color(@Parent() teacher: Teacher) {
    return teacher.user?.color ?? null;
  }

  @ResolveField(() => String)
  initials(@Parent() teacher: Teacher) {
    return `${teacher.firstName.charAt(0).toUpperCase()}${teacher.fatherName.charAt(0).toUpperCase()}`;
  }

  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @Mutation(() => Teacher)
  updateTeacher(@Args('updateTeacherInput') updateTeacherInput: UpdateTeacherInput) {
    return this.teachersService.update(updateTeacherInput.id, updateTeacherInput);
  }

  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @Mutation(() => Teacher)
  removeTeacher(@Args('id', { type: () => String }) id: string) {
    return this.teachersService.remove(id);
  }
}
