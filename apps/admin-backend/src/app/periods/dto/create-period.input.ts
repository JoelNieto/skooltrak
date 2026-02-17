import { TransformDateToNoon } from '@/shared';
import { Prisma } from '@generated/prisma';
import { Field, InputType, Int } from '@nestjs/graphql';
@InputType()
export class CreatePeriodInput implements Prisma.PeriodUncheckedCreateInput {
  @Field(() => String, { description: 'Name of the period' })
  name: string;
  @Field(() => String, { description: 'Short name of the period', defaultValue: '' })
  shortName: string;
  @Field(() => Int, { description: 'Year of the period' })
  year: number;
  @TransformDateToNoon()
  @Field(() => Date, { description: 'Start date of the period' })
  startDate: Date;
  @TransformDateToNoon()
  @Field(() => Date, { description: 'End date of the period' })
  endDate: Date;
}
