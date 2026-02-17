import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CoursesService } from '../courses/courses.service';
import { Course } from '../courses/entities/course.entity';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { Grade } from './entities/grade.entity';
import { GradesService } from './grades.service';

@Resolver(() => Grade)
export class GradesResolver {
  constructor(
    private readonly gradesService: GradesService,
    private readonly coursesService: CoursesService,
  ) {}

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
    @Args('periodId', { type: () => String }) periodId?: string,
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

  @ResolveField(() => Course)
  async course(@Parent() grade: Grade) {
    // If course is already loaded, return it
    if (grade.course && typeof grade.course === 'object' && 'id' in grade.course) {
      return grade.course;
    }
    // Otherwise, fetch it using the courseId
    if (!grade.courseId) {
      throw new Error(`Grade ${grade.id} does not have a courseId`);
    }
    return this.coursesService.findOne(grade.courseId);
  }
}
