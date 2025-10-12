import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateClassGroupInput
  implements Prisma.ClassGroupUncheckedCreateInput
{
  @Field(() => String, { description: 'Name of the class group' })
  name: string;
  @Field(() => String, { description: 'Short name of the class group' })
  shortName: string;
  @Field(() => String, { description: 'Organization ID of the class group' })
  organizationId: string;
  @Field(() => String, { description: 'School ID of the class group' })
  schoolId: string;
  @Field(() => String, { description: 'Subject ID of the class group' })
  subjectId: string;
  @Field(() => String, { description: 'Study plan ID of the class group' })
  studyPlanId: string;
  @Field(() => Boolean, { description: 'Active status of the class group' })
  active: boolean;
}
