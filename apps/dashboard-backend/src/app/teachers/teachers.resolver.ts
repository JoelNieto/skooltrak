import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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
