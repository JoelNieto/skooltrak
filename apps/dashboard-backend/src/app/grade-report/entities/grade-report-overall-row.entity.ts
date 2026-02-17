import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GradeReportOverallRow {
  @Field(() => [Float], {
    description: 'Overall average per period - null for future',
    nullable: 'items',
  })
  periodAverages: (number | null)[];

  @Field(() => Float, {
    description: 'Overall cumulative average',
    nullable: true,
  })
  cumulativeAverage: number | null;
}
