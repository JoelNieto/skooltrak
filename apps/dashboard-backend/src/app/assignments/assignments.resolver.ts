import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';
import { AssignmentDateWithDetails } from './entities/assignment-date-with-details.entity';
import { Assignment } from './entities/assignment.entity';

@Resolver(() => Assignment)
export class AssignmentsResolver {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Mutation(() => Assignment)
  createAssignment(
    @Args('createAssignmentInput') createAssignmentInput: CreateAssignmentInput
  ) {
    return this.assignmentsService.create(createAssignmentInput);
  }

  @Query(() => [Assignment], { name: 'assignments' })
  findAll() {
    return this.assignmentsService.findAll();
  }

  @Query(() => Assignment, { name: 'assignment' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Query(() => [Assignment], { name: 'assignmentsBySchoolId' })
  findAssignmentBySchoolId(
    @Args('schoolId', { type: () => String }) schoolId: string,
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string
  ) {
    return this.assignmentsService.findAssignmentBySchoolId(
      schoolId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Query(() => [Assignment], { name: 'assignmentsByCourseId' })
  findAssignmentByCourseId(
    @Args('courseId', { type: () => String }) courseId: string,
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string
  ) {
    return this.assignmentsService.findAssignmentByCourseId(
      courseId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Query(() => [AssignmentDateWithDetails], { name: 'assignmentDatesBySchoolId' })
  findAssignmentDatesBySchoolId(
    @Args('schoolId', { type: () => String }) schoolId: string,
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string,
    @Args('classGroupId', { type: () => String, nullable: true })
    classGroupId?: string
  ) {
    return this.assignmentsService.findAssignmentDatesBySchoolId(
      schoolId,
      new Date(startDate),
      new Date(endDate),
      classGroupId
    );
  }

  @Query(() => [AssignmentDateWithDetails], { name: 'assignmentDatesByCourseId' })
  findAssignmentDatesByCourseId(
    @Args('courseId', { type: () => String }) courseId: string,
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string,
    @Args('classGroupId', { type: () => String, nullable: true })
    classGroupId?: string
  ) {
    return this.assignmentsService.findAssignmentDatesByCourseId(
      courseId,
      new Date(startDate),
      new Date(endDate),
      classGroupId
    );
  }

  @Mutation(() => Assignment)
  updateAssignment(
    @Args('updateAssignmentInput') updateAssignmentInput: UpdateAssignmentInput
  ) {
    return this.assignmentsService.update(
      updateAssignmentInput.id,
      updateAssignmentInput
    );
  }

  @Mutation(() => Assignment)
  removeAssignment(@Args('id', { type: () => String }) id: string) {
    return this.assignmentsService.remove(id);
  }
}
