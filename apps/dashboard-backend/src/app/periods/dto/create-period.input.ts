import { Prisma } from '@generated/prisma';
import { Field, InputType, Int } from '@nestjs/graphql';
@InputType()
export class CreatePeriodInput implements Prisma.PeriodUncheckedCreateInput {
  @Field(() => String, { description: 'School ID of the period' })
  schoolId: string;
  @Field(() => String, { description: 'Name of the period' })
  name: string;
  @Field(() => String, { description: 'Short name of the period' })
  shortName: string;
  @Field(() => Int, { description: 'Year of the period' })
  year: number;
  @Field(() => Date, { description: 'Start date of the period' })
  startDate: string | Date;
  @Field(() => Date, { description: 'End date of the period' })
  endDate: string | Date;
}
