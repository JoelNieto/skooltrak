import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
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
  @Field(() => String, { description: 'Study plan ID of the class group' })
  studyPlanId: string;
  @Field(() => String, {
    description: 'Teacher ID of the class group',
    nullable: true,
  })
  teacherId: string;
  @Field(() => Boolean, {
    description: 'Active status of the class group',
    defaultValue: true,
  })
  active: boolean;
}
