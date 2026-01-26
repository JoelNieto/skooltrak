import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class AttendanceFilterInput {
  @Field(() => String, { description: 'Course ID' })
  courseId: string;

  @Field(() => String, { description: 'Class group ID', nullable: true })
  classGroupId?: string;

  @Field(() => Date, { description: 'Start date filter', nullable: true })
  startDate?: Date;

  @Field(() => Date, { description: 'End date filter', nullable: true })
  endDate?: Date;

  @Field(() => Int, { nullable: true, description: 'Skip', defaultValue: 0 })
  skip?: number;

  @Field(() => Int, { nullable: true, description: 'Take', defaultValue: 20 })
  take?: number;
}
