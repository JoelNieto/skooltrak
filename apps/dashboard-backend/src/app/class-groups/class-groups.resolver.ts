import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClassGroupsService } from './class-groups.service';
import { CreateClassGroupInput } from './dto/create-class-group.input';
import { UpdateClassGroupInput } from './dto/update-class-group.input';
import { ClassGroup } from './entities/class-group.entity';

@Resolver(() => ClassGroup)
export class ClassGroupsResolver {
  constructor(private readonly classGroupsService: ClassGroupsService) {}

  @Mutation(() => ClassGroup)
  createClassGroup(
    @Args('createClassGroupInput') createClassGroupInput: CreateClassGroupInput
  ) {
    return this.classGroupsService.create(createClassGroupInput);
  }

  @Query(() => [ClassGroup], { name: 'classGroups' })
  findAll() {
    return this.classGroupsService.findAll();
  }

  @Query(() => ClassGroup, { name: 'classGroup' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.classGroupsService.findOne(id);
  }

  @Mutation(() => ClassGroup)
  updateClassGroup(
    @Args('updateClassGroupInput') updateClassGroupInput: UpdateClassGroupInput
  ) {
    return this.classGroupsService.update(
      updateClassGroupInput.id,
      updateClassGroupInput
    );
  }

  @Mutation(() => ClassGroup)
  removeClassGroup(@Args('id', { type: () => String }) id: string) {
    return this.classGroupsService.remove(id);
  }
}
