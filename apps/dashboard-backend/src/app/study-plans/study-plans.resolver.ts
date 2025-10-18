import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateStudyPlanInput } from './dto/create-study-plan.input';
import { UpdateStudyPlanInput } from './dto/update-study-plan.input';
import { StudyPlan } from './entities/study-plan.entity';
import { StudyPlansService } from './study-plans.service';

@Resolver(() => StudyPlan)
export class StudyPlansResolver {
  constructor(private readonly studyPlansService: StudyPlansService) {}

  @Mutation(() => StudyPlan)
  createStudyPlan(
    @Args('createStudyPlanInput') createStudyPlanInput: CreateStudyPlanInput
  ) {
    return this.studyPlansService.create(createStudyPlanInput);
  }

  @Query(() => [StudyPlan], { name: 'studyPlans' })
  findAll() {
    return this.studyPlansService.findAll();
  }

  @Query(() => [StudyPlan], { name: 'studyPlansBySchoolId' })
  findAllBySchoolId(
    @Args('schoolId', { type: () => String }) schoolId: string,
    @Args('degreeId', { type: () => String, nullable: true }) degreeId?: string
  ) {
    return this.studyPlansService.findAllBySchoolId(schoolId, degreeId);
  }

  @Query(() => StudyPlan, { name: 'studyPlan' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.studyPlansService.findOne(id);
  }

  @Mutation(() => StudyPlan)
  updateStudyPlan(
    @Args('updateStudyPlanInput') updateStudyPlanInput: UpdateStudyPlanInput
  ) {
    return this.studyPlansService.update(
      updateStudyPlanInput.id,
      updateStudyPlanInput
    );
  }

  @Mutation(() => StudyPlan)
  removeStudyPlan(@Args('id', { type: () => String }) id: string) {
    return this.studyPlansService.remove(id);
  }
}
