import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CreateTeacherInput } from './dto/create-teacher.input';
import { UpdateTeacherInput } from './dto/update-teacher.input';
import { Teacher } from './entities/teacher.entity';
import { TeachersService } from './teachers.service';

@Resolver(() => Teacher)
export class TeachersResolver {
  constructor(private readonly teachersService: TeachersService) {}

  @Mutation(() => Teacher)
  createTeacher(
    @Args('createTeacherInput') createTeacherInput: CreateTeacherInput
  ) {
    return this.teachersService.create(createTeacherInput);
  }

  @Query(() => [Teacher], { name: 'teachers' })
  findAll() {
    return this.teachersService.findAll();
  }

  @Query(() => Teacher, { name: 'teacher' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.teachersService.findOne(id);
  }

  @Query(() => [Teacher], { name: 'teachersByOrganizationId' })
  findManyByOrganizationId(
    @Args('organizationId', { type: () => String }) organizationId: string
  ) {
    return this.teachersService.findManyByOrganizationId(organizationId);
  }

  @ResolveField(() => String)
  name(@Parent() teacher: Teacher) {
    return `${teacher.firstName} ${teacher.fatherName}`;
  }

  @ResolveField(() => String)
  fullName(@Parent() teacher: Teacher) {
    return `${teacher.firstName} ${teacher.middleName} ${teacher.fatherName} ${teacher.motherName}`;
  }

  @ResolveField(() => String)
  initials(@Parent() teacher: Teacher) {
    return `${teacher.firstName.charAt(0).toUpperCase()}${teacher.fatherName
      .charAt(0)
      .toUpperCase()}`;
  }

  @Mutation(() => Teacher)
  updateTeacher(
    @Args('updateTeacherInput') updateTeacherInput: UpdateTeacherInput
  ) {
    return this.teachersService.update(
      updateTeacherInput.id,
      updateTeacherInput
    );
  }

  @Mutation(() => Teacher)
  removeTeacher(@Args('id', { type: () => String }) id: string) {
    return this.teachersService.remove(id);
  }
}
