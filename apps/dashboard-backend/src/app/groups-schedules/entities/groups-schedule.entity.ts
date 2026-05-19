import { $Enums, Prisma } from '@generated/prisma';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';

export class GroupsSchedule
  implements
    Prisma.ClassGroupWeeklyScheduleGetPayload<{
      include: {
        classGroup: true;
        course: true;
      };
    }>
{
    id: string;
    classGroup: ClassGroup;
    course: Course;
    classGroupId: string;
    courseId: string;
    location: string;
    remote: boolean;
    remoteLink: string;
    weekday: $Enums.WeekDay;
    startTime: string;
    endTime: string;
    recess: boolean;
    createdAt: Date;
    updatedAt: Date;
}
