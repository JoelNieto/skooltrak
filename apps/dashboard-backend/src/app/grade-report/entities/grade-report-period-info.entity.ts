import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GradeReportPeriodInfo {
  @Field(() => String, { description: 'Period ID' })
  id: string;

  @Field(() => String, { description: 'Period name' })
  name: string;
  @Field(() => String, { description: 'Period short name' })
  shortName: string;
}
