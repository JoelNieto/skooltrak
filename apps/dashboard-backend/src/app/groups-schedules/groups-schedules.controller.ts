import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGroupsScheduleInput } from './dto/create-groups-schedule.input';
import { UpdateGroupsScheduleInput } from './dto/update-groups-schedule.input';
import { GroupsSchedulesService } from './groups-schedules.service';

@ApiTags('groups-schedules')
@Controller('v1/groups-schedules')
export class GroupsSchedulesController {
  constructor(private readonly groupsSchedulesService: GroupsSchedulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create groups schedule' })
  create(@Body() createGroupsScheduleInput: CreateGroupsScheduleInput) {
    return this.groupsSchedulesService.create(createGroupsScheduleInput);
  }

  @Get()
  @ApiOperation({ summary: 'List groups schedules' })
  findAll() {
    return this.groupsSchedulesService.findAll();
  }

  @Get('by-class-group/:classGroupId/grouped')
  @ApiOperation({ summary: 'Schedules by class group (grouped)' })
  findAllByClassGroupIdGrouped(@Param('classGroupId') classGroupId: string) {
    return this.groupsSchedulesService.findAllByClassGroupIdGrouped(classGroupId);
  }

  @Get('by-class-group/:classGroupId')
  @ApiOperation({ summary: 'Schedules by class group' })
  findAllByClassGroupId(@Param('classGroupId') classGroupId: string) {
    return this.groupsSchedulesService.findAllByClassGroupId(classGroupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get groups schedule by id' })
  findOne(@Param('id') id: string) {
    return this.groupsSchedulesService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update groups schedule' })
  update(@Body() updateGroupsScheduleInput: UpdateGroupsScheduleInput) {
    return this.groupsSchedulesService.update(updateGroupsScheduleInput.id, updateGroupsScheduleInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete groups schedule' })
  remove(@Param('id') id: string) {
    return this.groupsSchedulesService.remove(id);
  }
}
