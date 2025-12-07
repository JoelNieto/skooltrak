import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
import { Subject } from './entities/subject.entity';
import { SubjectsService } from './subjects.service';

import { JwtAuthGuard } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { FetchDataInput } from '../fetch-data.input';

@Resolver(() => Subject)
export class SubjectsResolver {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Mutation(() => Subject)
  createSubject(
    @Args('createSubjectInput') createSubjectInput: CreateSubjectInput
  ) {
    return this.subjectsService.create(createSubjectInput);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Subject], { name: 'subjects' })
  findAll(
    @Args()
    fetchDataInput: FetchDataInput
  ) {
    return this.subjectsService.findAll(fetchDataInput);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Subject, { name: 'subject' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.subjectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Int, { name: 'findManySubjectsCount' })
  findManySubjectsCount(
    @Args()
    fetchDataInput: FetchDataInput
  ) {
    return this.subjectsService.findCount(fetchDataInput);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Subject)
  updateSubject(
    @Args('updateSubjectInput') updateSubjectInput: UpdateSubjectInput
  ) {
    return this.subjectsService.update(
      updateSubjectInput.id,
      updateSubjectInput
    );
  }

  @Mutation(() => Subject)
  removeSubject(@Args('id', { type: () => String }) id: string) {
    return this.subjectsService.remove(id);
  }
}
