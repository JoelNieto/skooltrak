import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { Grade } from './entities/grade.entity';
import { GradesService } from './grades.service';

@Resolver(() => Grade)
export class GradesResolver {
  constructor(private readonly gradesService: GradesService) {}

  @Mutation(() => Grade)
  createGrade(@Args('createGradeInput') createGradeInput: CreateGradeInput) {
    return this.gradesService.create(createGradeInput);
  }

  @Query(() => [Grade], { name: 'grades' })
  findAll() {
    return this.gradesService.findAll();
  }

  @Query(() => Grade, { name: 'grade' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.gradesService.findOne(id);
  }

  @Query(() => [Grade], { name: 'gradesByCourseId' })
  findByCourseId(
    @Args('courseId', { type: () => String }) courseId: string,
    @Args('periodId', { type: () => String }) periodId?: string
  ) {
    return this.gradesService.findByCourseId(courseId, periodId);
  }

  @Mutation(() => Grade)
  updateGrade(@Args('updateGradeInput') updateGradeInput: UpdateGradeInput) {
    return this.gradesService.update(updateGradeInput.id, updateGradeInput);
  }

  @Mutation(() => Grade)
  removeGrade(@Args('id', { type: () => String }) id: string) {
    return this.gradesService.remove(id);
  }
}
