import { Field, ObjectType } from '@nestjs/graphql';
import { GradeReportPeriodAttendance } from './grade-report-period-attendance.entity';

@ObjectType()
export class GradeReportAttendanceRow {
  @Field(() => String, { description: 'Course ID' })
  courseId: string;

  @Field(() => String, { description: 'Course name (subject name)' })
  courseName: string;

  @Field(() => [GradeReportPeriodAttendance], {
    description: 'Attendance per period',
  })
  periodAttendance: GradeReportPeriodAttendance[];
}
