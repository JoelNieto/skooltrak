import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreatePeriodInput } from './dto/create-period.input';
import { UpdatePeriodInput } from './dto/update-period.input';
import { Period } from './entities/period.entity';
import { PeriodsService } from './periods.service';

@Resolver(() => Period)
export class PeriodsResolver {
  constructor(private readonly periodsService: PeriodsService) {}

  @Mutation(() => Period)
  createPeriod(
    @Args('createPeriodInput') createPeriodInput: CreatePeriodInput
  ) {
    return this.periodsService.create(createPeriodInput);
  }

  @Query(() => [Period], { name: 'periods' })
  findAll() {
    return this.periodsService.findAll();
  }

  @Query(() => [Period], { name: 'periodsBySchoolId' })
  findManyBySchoolId(
    @Args('schoolId', { type: () => String }) schoolId: string
  ) {
    return this.periodsService.findManyBySchoolId(schoolId);
  }

  @Query(() => Period, { name: 'period' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.periodsService.findOne(id);
  }

  @Mutation(() => Period)
  updatePeriod(
    @Args('updatePeriodInput') updatePeriodInput: UpdatePeriodInput
  ) {
    return this.periodsService.update(updatePeriodInput.id, updatePeriodInput);
  }

  @Mutation(() => Period)
  removePeriod(@Args('id', { type: () => String }) id: string) {
    return this.periodsService.remove(id);
  }
}
