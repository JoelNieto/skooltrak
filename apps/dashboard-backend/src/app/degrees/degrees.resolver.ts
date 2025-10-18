import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DegreesService } from './degrees.service';
import { CreateDegreeInput } from './dto/create-degree.input';
import { UpdateDegreeInput } from './dto/update-degree.input';
import { Degree } from './entities/degree.entity';

@Resolver(() => Degree)
export class DegreesResolver {
  constructor(private readonly degreesService: DegreesService) {}

  @Mutation(() => Degree)
  createDegree(
    @Args('createDegreeInput') createDegreeInput: CreateDegreeInput
  ) {
    return this.degreesService.create(createDegreeInput);
  }

  @Query(() => [Degree], { name: 'degrees' })
  findAll() {
    return this.degreesService.findAll();
  }

  @Query(() => Degree, { name: 'degree' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.degreesService.findOne(id);
  }

  @Query(() => [Degree], { name: 'degreesBySchoolId' })
  findManyBySchoolId(
    @Args('schoolId', { type: () => String }) schoolId: string
  ) {
    return this.degreesService.findManyBySchoolId(schoolId);
  }

  @Mutation(() => Degree)
  updateDegree(
    @Args('updateDegreeInput') updateDegreeInput: UpdateDegreeInput
  ) {
    return this.degreesService.update(updateDegreeInput.id, updateDegreeInput);
  }

  @Mutation(() => Degree)
  removeDegree(@Args('id', { type: () => String }) id: string) {
    return this.degreesService.remove(id);
  }
}
