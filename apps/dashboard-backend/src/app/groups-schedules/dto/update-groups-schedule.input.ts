import { PartialType } from '@nestjs/swagger';
import { CreateGroupsScheduleInput } from './create-groups-schedule.input';

export class UpdateGroupsScheduleInput extends PartialType(
  CreateGroupsScheduleInput
) {
    id: string;
}
