import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Course } from '../../courses/entities/course.entity';
import { Degree } from '../../degrees/entities/degree.entity';
import { School } from '../../schools/entities/school.entity';

@ObjectType()
export class StudyPlan implements Prisma.StudyPlanCreateInput {
  @Field(() => String, { description: 'ID of the study plan' })
  id: string;

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

  @Field(() => String, { description: 'Degree ID of the study plan' })
  degreeId: string;

  @Field(() => Date, { description: 'Created at of the study plan' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at of the study plan' })
  updatedAt: Date;

  @Field(() => Degree, { description: 'Degree of the study plan' })
  degree: Prisma.DegreeCreateNestedOneWithoutStudyPlansInput;

  @Field(() => School, { description: 'School of the study plan' })
  school: Prisma.SchoolCreateNestedOneWithoutStudyPlansInput;

  @Field(() => [Course], { description: 'Courses of the study plan' })
  courses?: Prisma.CourseCreateNestedManyWithoutStudyPlanInput;
}
