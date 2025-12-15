import { Prisma } from '@generated/prisma';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Degree } from '../../degrees/entities/degree.entity';
import { GradeMetric } from '../../grade-metrics/entities/grade-metric.entity';
import { School } from '../../schools/entities/school.entity';
@ObjectType()
export class StudyPlan
  implements
    Prisma.StudyPlanGetPayload<{
      include: { degree: true; school: true; gradeMetric: true };
    }>
{
  @Field(() => String, { description: 'ID of the study plan' })
  id: string;
  @Field(() => Degree, { description: 'Degree of the study plan' })
  degree: Degree;
  @Field(() => String, { description: 'Degree ID of the study plan' })
  degreeId: string;
  @Field(() => School, { description: 'School of the study plan' })
  school: School;
  @Field(() => String, { description: 'Name of the study plan' })
  name: string;
  @Field(() => String, { description: 'Short name of the study plan' })
  shortName: string;
  @Field(() => Int, { description: 'Level of the study plan' })
  level: number;
  @Field(() => String, { description: 'Description of the study plan' })
  description: string;
  @Field(() => String, { description: 'Code of the study plan' })
  code: string;
  @Field(() => String, { description: 'School ID of the study plan' })
  schoolId: string;

  @Field(() => GradeMetric, {
    description: 'Grade metric of the study plan',
    nullable: true,
  })
  gradeMetric: GradeMetric;
  @Field(() => String, {
    description: 'Grade metric ID of the study plan',
    nullable: true,
  })
  gradeMetricId: string;
  @Field(() => Date, { description: 'Created at of the study plan' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at of the study plan' })
  updatedAt: Date;
}
