import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { School } from '../../schools/entities/school.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';

@ObjectType()
export class Degree implements Prisma.DegreeCreateInput {
  @Field(() => String, { description: 'ID of the degree' })
  id?: string;
  @Field(() => School, { description: 'School of the degree' })
  school: Prisma.SchoolCreateNestedOneWithoutDegreesInput;
  @Field(() => [StudyPlan], { description: 'Study plans of the degree' })
  studyPlans?: Prisma.StudyPlanCreateNestedManyWithoutDegreeInput;

  @Field(() => String, { description: 'Name of the degree' })
  name: string;

  @Field(() => String, { description: 'Short name of the degree' })
  shortName: string;

  @Field(() => String, { description: 'School ID of the degree' })
  schoolId: string;

  @Field(() => Date, { description: 'Created at of the degree' })
  createdAt?: string | Date;

  @Field(() => Date, { description: 'Updated at of the degree' })
  updatedAt?: string | Date;
}
