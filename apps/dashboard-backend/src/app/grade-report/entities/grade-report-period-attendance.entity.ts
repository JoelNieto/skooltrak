import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GradeReportPeriodAttendance {
  @Field(() => String, { description: 'Period ID' })
  periodId: string;

  @Field(() => Int, { description: 'Absent count for this period' })
  absent: number;

  @Field(() => Int, { description: 'Late count for this period' })
  late: number;
}
