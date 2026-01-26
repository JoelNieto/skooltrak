import { TransformDateToNoon } from '@/shared';
import { Field, InputType } from '@nestjs/graphql';
import { CreateAttendanceRecordInput } from './create-attendance-record.input';

@InputType()
export class CreateAttendanceSessionInput {
  @TransformDateToNoon()
  @Field(() => Date, { description: 'Date of the attendance session' })
  date: Date;

  @Field(() => String, { description: 'Course ID' })
  courseId: string;

  @Field(() => String, { description: 'Class group ID' })
  classGroupId: string;

  @Field(() => [CreateAttendanceRecordInput], {
    description: 'Attendance records for each student',
  })
  records: CreateAttendanceRecordInput[];
}
