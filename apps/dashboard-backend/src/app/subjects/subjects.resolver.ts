import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
import { Subject } from './entities/subject.entity';
import { SubjectsService } from './subjects.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_SUBJECTS)
@Resolver(() => Subject)
export class SubjectsResolver {
  constructor(private readonly subjectsService: SubjectsService) {}

  @RequirePermissions(Perm.MANAGE_SUBJECTS)
  @Mutation(() => Subject)
  createSubject(@Args('createSubjectInput') createSubjectInput: CreateSubjectInput) {
    return this.subjectsService.create(createSubjectInput);
  }

  @Query(() => [Subject], { name: 'subjects' })
  findAll(
    @Args()
    fetchDataInput: FetchDataInput,
  ) {
    return this.subjectsService.findAll(fetchDataInput);
  }

  @Query(() => Subject, { name: 'subject' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.subjectsService.findOne(id);
  }

  @Query(() => Int, { name: 'findManySubjectsCount' })
  findManySubjectsCount(
    @Args()
    fetchDataInput: FetchDataInput,
  ) {
    return this.subjectsService.findCount(fetchDataInput);
  }

  @RequirePermissions(Perm.MANAGE_SUBJECTS)
  @Mutation(() => Subject)
  updateSubject(@Args('updateSubjectInput') updateSubjectInput: UpdateSubjectInput) {
    return this.subjectsService.update(updateSubjectInput.id, updateSubjectInput);
  }

  @RequirePermissions(Perm.MANAGE_SUBJECTS)
  @Mutation(() => Subject)
  removeSubject(@Args('id', { type: () => String }) id: string) {
    return this.subjectsService.remove(id);
  }
}
