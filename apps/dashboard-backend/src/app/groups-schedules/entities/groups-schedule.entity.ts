import { $Enums, Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';

@ObjectType()
export class GroupsSchedule
  implements
    Prisma.ClassGroupWeeklyScheduleGetPayload<{
      include: {
        classGroup: true;
        course: true;
      };
    }>
{
  @Field(() => String, { description: 'ID of the groups schedule' })
  id: string;
  @Field(() => ClassGroup, {
    description: 'Class group of the groups schedule',
  })
  classGroup: ClassGroup;
  @Field(() => Course, { description: 'Course of the groups schedule' })
  course: Course;
  @Field(() => String, { description: 'Class group ID of the groups schedule' })
  classGroupId: string;
  @Field(() => String, { description: 'Course ID of the groups schedule' })
  courseId: string;
  @Field(() => String, { description: 'Week day of the groups schedule' })
  weekday: $Enums.WeekDay;
  @Field(() => String, { description: 'Start time of the groups schedule' })
  startTime: string;
  @Field(() => String, { description: 'End time of the groups schedule' })
  endTime: string;
  @Field(() => Date, { description: 'Created at of the groups schedule' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at of the groups schedule' })
  updatedAt: Date;
}
