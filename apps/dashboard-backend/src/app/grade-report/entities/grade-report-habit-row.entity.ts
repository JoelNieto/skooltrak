import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GradeReportHabitRow {
  @Field(() => String, { description: 'Habit metric name' })
  metricName: string;

  @Field(() => String, { description: 'Value: X (Deficiente), R (Regular), S (Satisfactorio)' })
  value: string;
}
