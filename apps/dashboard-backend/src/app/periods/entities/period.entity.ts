import { Prisma } from '@generated/prisma';
import { Field, Int, ObjectType } from '@nestjs/graphql';
@ObjectType()
export class Period implements Prisma.PeriodGetPayload<{ include: undefined }> {
  @Field(() => String, { description: 'ID of the period' })
  id: string;
  @Field(() => String, { description: 'Name of the period' })
  name: string;
  @Field(() => String, { description: 'School ID of the period' })
  schoolId: string;
  @Field(() => String, { description: 'Short name of the period' })
  shortName: string;
  @Field(() => Int, { description: 'Year of the period' })
  year: number;
  @Field(() => Date, { description: 'Start date of the period' })
  startDate: Date;
  @Field(() => Date, { description: 'End date of the period' })
  endDate: Date;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
