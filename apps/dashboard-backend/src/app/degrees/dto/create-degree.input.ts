import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateDegreeInput implements Prisma.DegreeUncheckedCreateInput {
  @Field(() => String, { description: 'Name of the degree' })
  name: string;
  @Field(() => String, { description: 'Short name of the degree' })
  shortName: string;
  @Field(() => String, { description: 'School ID' })
  schoolId: string;
}
