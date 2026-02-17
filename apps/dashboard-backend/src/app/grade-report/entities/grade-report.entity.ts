import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GradeReportAttendanceRow } from './grade-report-attendance-row.entity';
import { GradeReportGradesRow } from './grade-report-grades-row.entity';
import { GradeReportHabitRow } from './grade-report-habit-row.entity';
import { GradeReportOverallRow } from './grade-report-overall-row.entity';
import { GradeReportPeriodInfo } from './grade-report-period-info.entity';

@ObjectType()
export class GradeReport {
  @Field(() => String, { description: 'School name' })
  schoolName: string;

  @Field(() => String, {
    description: 'Presigned URL for the school logo',
    nullable: true,
  })
  schoolLogoUrl: string | null;

  @Field(() => String, { description: 'Period name for the report' })
  periodName: string;

  @Field(() => String, { description: 'Student full name' })
  studentName: string;

  @Field(() => String, { description: 'Student document ID' })
  documentId: string;

  @Field(() => String, {
    description: 'Class group name',
    nullable: true,
  })
  classGroupName: string | null;

  @Field(() => String, {
    description: 'Teacher name (class group homeroom teacher)',
    nullable: true,
  })
  teacherName: string | null;

  @Field(() => String, {
    description: 'Study plan name',
    nullable: true,
  })
  studyPlanName: string | null;

  @Field(() => Int, {
    description: 'Study plan level',
    nullable: true,
  })
  level: number | null;

  @Field(() => [GradeReportPeriodInfo], {
    description: 'All periods in the school year',
  })
  periods: GradeReportPeriodInfo[];

  @Field(() => [GradeReportGradesRow], { description: 'Grades per course' })
  gradesRows: GradeReportGradesRow[];

  @Field(() => GradeReportOverallRow, {
    description: 'Overall averages row',
    nullable: true,
  })
  overallGradesRow: GradeReportOverallRow | null;

  @Field(() => [GradeReportAttendanceRow], {
    description: 'Attendance per course per period',
  })
  attendanceRows: GradeReportAttendanceRow[];

  @Field(() => [GradeReportHabitRow], {
    description: 'Habit metrics so far',
  })
  habitRows: GradeReportHabitRow[];
}
