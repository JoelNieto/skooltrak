import { $Enums, Prisma } from '@generated/prisma';
export class CreateGroupsScheduleInput
  implements Prisma.ClassGroupWeeklyScheduleUncheckedCreateInput
{
    classGroupId: string;
    courseId: string;
    weekday: $Enums.WeekDay;
    location: string;
    remote: boolean;
    remoteLink: string;
    startTime: string;
    endTime: string;
}
