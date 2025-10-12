import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@ObjectType()
export class ClassGroup
  implements
    Prisma.ClassGroupGetPayload<{
      include: { teacher: true; studyPlan: true };
    }>
{
  @Field(() => String, { description: 'ID of the class group' })
  id: string;
  @Field(() => String, { description: 'Name of the class group' })
  name: string;
  @Field(() => String, { description: 'Short name of the class group' })
  shortName: string;
  @Field(() => String, { description: 'Organization ID of the class group' })
  organizationId: string;
  @Field(() => String, { description: 'School ID of the class group' })
  schoolId: string;
  @Field(() => Boolean, { description: 'Active status of the class group' })
  active: boolean;
  @Field(() => String, { description: 'Teacher ID of the class group' })
  teacherId: string;
  @Field(() => String, { description: 'Study plan ID of the class group' })
  studyPlanId: string;
  @Field(() => Teacher, { description: 'Teacher of the class group' })
  teacher: Teacher;
  @Field(() => StudyPlan, { description: 'Study plan of the class group' })
  studyPlan: StudyPlan;
  @Field(() => Date, { description: 'Created at of the class group' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at of the class group' })
  updatedAt: Date;
}
