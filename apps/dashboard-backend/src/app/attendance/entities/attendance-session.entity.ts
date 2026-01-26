import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { AttendanceRecord } from './attendance-record.entity';

@ObjectType()
export class AttendanceSession
  implements
    Prisma.AttendanceSessionGetPayload<{
      include: {
        course: true;
        classGroup: true;
        teacher: true;
        records: { include: { student: true } };
      };
    }>
{
  @Field(() => String, { description: 'ID of the attendance session' })
  id: string;

  @Field(() => Date, { description: 'Date of the attendance session' })
  date: Date;

  @Field(() => String, { description: 'Course ID' })
  courseId: string;

  @Field(() => Course, { description: 'Course of this session' })
  course: Course;

  @Field(() => String, { description: 'Class group ID' })
  classGroupId: string;

  @Field(() => ClassGroup, { description: 'Class group of this session' })
  classGroup: ClassGroup;

  @Field(() => String, { description: 'Teacher ID' })
  teacherId: string;

  @Field(() => Teacher, { description: 'Teacher who created this session' })
  teacher: Teacher;

  @Field(() => String, { description: 'Organization ID' })
  organizationId: string;

  @Field(() => [AttendanceRecord], {
    description: 'Attendance records for this session',
  })
  records: AttendanceRecord[];

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
