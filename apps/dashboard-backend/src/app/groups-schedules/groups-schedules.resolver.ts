import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateGroupsScheduleInput } from './dto/create-groups-schedule.input';
import { UpdateGroupsScheduleInput } from './dto/update-groups-schedule.input';
import { GroupsSchedule } from './entities/groups-schedule.entity';
import { GroupsSchedulesService } from './groups-schedules.service';

@Resolver(() => GroupsSchedule)
export class GroupsSchedulesResolver {
  constructor(
    private readonly groupsSchedulesService: GroupsSchedulesService
  ) {}

  @Mutation(() => GroupsSchedule)
  createGroupsSchedule(
    @Args('createGroupsScheduleInput')
    createGroupsScheduleInput: CreateGroupsScheduleInput
  ) {
    return this.groupsSchedulesService.create(createGroupsScheduleInput);
  }

  @Query(() => [GroupsSchedule], { name: 'groupsSchedules' })
  findAll() {
    return this.groupsSchedulesService.findAll();
  }

  @Query(() => GroupsSchedule, { name: 'groupsSchedule' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.groupsSchedulesService.findOne(id);
  }

  @Query(() => [GroupsSchedule], { name: 'groupsSchedulesByClassGroupId' })
  findAllByClassGroupId(
    @Args('classGroupId', { type: () => String }) classGroupId: string
  ) {
    return this.groupsSchedulesService.findAllByClassGroupId(classGroupId);
  }

  @Query(() => [GroupsSchedule], {
    name: 'groupsSchedulesByClassGroupIdGrouped',
  })
  findAllByClassGroupIdGrouped(
    @Args('classGroupId', { type: () => String }) classGroupId: string
  ) {
    return this.groupsSchedulesService.findAllByClassGroupIdGrouped(
      classGroupId
    );
  }

  @Mutation(() => GroupsSchedule)
  updateGroupsSchedule(
    @Args('updateGroupsScheduleInput')
    updateGroupsScheduleInput: UpdateGroupsScheduleInput
  ) {
    return this.groupsSchedulesService.update(
      updateGroupsScheduleInput.id,
      updateGroupsScheduleInput
    );
  }

  @Mutation(() => GroupsSchedule)
  removeGroupsSchedule(@Args('id', { type: () => String }) id: string) {
    return this.groupsSchedulesService.remove(id);
  }
}
