import { $Enums, Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateGroupsScheduleInput
  implements Prisma.ClassGroupWeeklyScheduleUncheckedCreateInput
{
  @Field(() => String, { description: 'Class group ID' })
  classGroupId: string;
  @Field(() => String, { description: 'Course ID' })
  courseId: string;
  @Field(() => String, { description: 'Week day' })
  weekday: $Enums.WeekDay;
  @Field(() => String, { description: 'Location' })
  location: string;
  @Field(() => Boolean, { description: 'Remote' })
  remote: boolean;
  @Field(() => String, { description: 'Remote link' })
  remoteLink: string;
  @Field(() => String, { description: 'Start time' })
  startTime: string;
  @Field(() => String, { description: 'End time' })
  endTime: string;
}
