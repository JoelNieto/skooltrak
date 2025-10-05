import { Field, InputType, Int } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateStudyPlanInput
  implements Prisma.StudyPlanUncheckedCreateInput
{
  @Field(() => String, { description: 'Name of the study plan' })
  name: string;

  @Field(() => String, { description: 'Short name of the study plan' })
  shortName: string;

  @Field(() => Int, { description: 'Level of the study plan' })
  level: number;

  @Field(() => String, { description: 'Degree ID of the study plan' })
  degreeId: string;

  @Field(() => String, { description: 'Description of the study plan' })
  description: string;

  @Field(() => String, { description: 'Code of the study plan' })
  code: string;

  @Field(() => String, { description: 'School ID of the study plan' })
  schoolId: string;
}
