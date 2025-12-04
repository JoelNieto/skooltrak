import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CoursesService } from './courses.service';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';
import { Course } from './entities/course.entity';

@Resolver(() => Course)
export class CoursesResolver {
  constructor(private readonly coursesService: CoursesService) {}

  @Mutation(() => Course)
  createCourse(
    @Args('createCourseInput') createCourseInput: CreateCourseInput
  ) {
    return this.coursesService.create(createCourseInput);
  }

  @Query(() => [Course], { name: 'courses' })
  findAll(@Args() fetchDataInput: FetchDataInput) {
    return this.coursesService.findAll(fetchDataInput);
  }

  @Query(() => Int, { name: 'coursesCount' })
  count(@Args() fetchDataInput: FetchDataInput) {
    return this.coursesService.count(fetchDataInput);
  }

  @Query(() => [Course], { name: 'coursesBySchoolId' })
  findManyBySchoolId(
    @Args('schoolId', { type: () => String }) schoolId: string
  ) {
    return this.coursesService.findManyBySchoolId(schoolId);
  }

  @Query(() => [Course], { name: 'coursesBySubjectId' })
  findManyBySubjectId(
    @Args('subjectId', { type: () => String }) subjectId: string
  ) {
    return this.coursesService.findManyBySubjectId(subjectId);
  }

  @Query(() => [Course], { name: 'coursesByStudyPlanId' })
  findManyByStudyPlanId(
    @Args('studyPlanId', { type: () => String }) studyPlanId: string
  ) {
    return this.coursesService.findManyByStudyPlanId(studyPlanId);
  }

  @Query(() => Course, { name: 'course' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.coursesService.findOne(id);
  }

  @Mutation(() => Course)
  updateCourse(
    @Args('updateCourseInput') updateCourseInput: UpdateCourseInput
  ) {
    return this.coursesService.update(updateCourseInput.id, updateCourseInput);
  }

  @Mutation(() => Course)
  removeCourse(@Args('id', { type: () => String }) id: string) {
    return this.coursesService.remove(id);
  }
}
