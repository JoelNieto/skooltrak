import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateGradeStudentInput } from './dto/create-grade-student.input';
import { UpdateGradeStudentInput } from './dto/update-grade-student.input';
import { GradeStudent } from './entities/grade-student.entity';
import { GradeStudentsService } from './grade-students.service';

@Resolver(() => GradeStudent)
export class GradeStudentsResolver {
  constructor(private readonly gradeStudentsService: GradeStudentsService) {}

  @Mutation(() => GradeStudent)
  createGradeStudent(
    @Args('createGradeStudentInput')
    createGradeStudentInput: CreateGradeStudentInput
  ) {
    return this.gradeStudentsService.create(createGradeStudentInput);
  }

  @Query(() => [GradeStudent], { name: 'gradeStudents' })
  findAll() {
    return this.gradeStudentsService.findAll();
  }

  @Query(() => GradeStudent, { name: 'gradeStudent' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.gradeStudentsService.findOne(id);
  }

  @Mutation(() => GradeStudent)
  updateGradeStudent(
    @Args('updateGradeStudentInput')
    updateGradeStudentInput: UpdateGradeStudentInput
  ) {
    return this.gradeStudentsService.update(
      updateGradeStudentInput.id,
      updateGradeStudentInput
    );
  }

  @Mutation(() => GradeStudent)
  removeGradeStudent(@Args('id', { type: () => String }) id: string) {
    return this.gradeStudentsService.remove(id);
  }
}
