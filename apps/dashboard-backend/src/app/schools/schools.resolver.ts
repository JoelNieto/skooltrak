import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { School } from './entities/school.entity';
import { SchoolsService } from './schools.service';

@Resolver(() => School)
export class SchoolsResolver {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Mutation(() => School)
  createSchool(
    @Args('createSchoolInput') createSchoolInput: CreateSchoolInput
  ) {
    return this.schoolsService.create(createSchoolInput);
  }

  @Query(() => [School], { name: 'schools' })
  findAll() {
    return this.schoolsService.findAll();
  }

  @Query(() => School, { name: 'school' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.schoolsService.findOne(id);
  }

  @Mutation(() => School)
  updateSchool(
    @Args('updateSchoolInput') updateSchoolInput: UpdateSchoolInput
  ) {
    return this.schoolsService.update(updateSchoolInput.id, updateSchoolInput);
  }

  @Mutation(() => School)
  removeSchool(@Args('id', { type: () => String }) id: string) {
    return this.schoolsService.remove(id);
  }
}
