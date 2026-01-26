import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AttendanceStats {
  @Field(() => Int, { description: 'Total attendance records' })
  total: number;

  @Field(() => Int, { description: 'Present count' })
  present: number;

  @Field(() => Int, { description: 'Absent count' })
  absent: number;

  @Field(() => Int, { description: 'Late count' })
  late: number;

  @Field(() => Int, { description: 'Sick leave count' })
  sickLeave: number;

  @Field(() => Int, { description: 'Excused count' })
  excused: number;

  @Field(() => Int, { description: 'Present percentage' })
  presentPercentage: number;

  @Field(() => Int, { description: 'Absent percentage' })
  absentPercentage: number;
}
