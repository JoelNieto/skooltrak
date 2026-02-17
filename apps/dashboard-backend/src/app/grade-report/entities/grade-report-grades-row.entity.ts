import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GradeReportGradesRow {
  @Field(() => String, { description: 'Course ID' })
  courseId: string;

  @Field(() => String, { description: 'Course name (subject name)' })
  courseName: string;

  @Field(() => [Float], {
    description: 'Period averages - null for future periods',
    nullable: 'items',
  })
  periodAverages: (number | null)[];

  @Field(() => Float, {
    description: 'Cumulative average (periods 1 through selected)',
    nullable: true,
  })
  cumulativeAverage: number | null;
}
