import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateGroupsScheduleInput } from './create-groups-schedule.input';

@InputType()
export class UpdateGroupsScheduleInput extends PartialType(
  CreateGroupsScheduleInput
) {
  @Field(() => String)
  id: string;
}
