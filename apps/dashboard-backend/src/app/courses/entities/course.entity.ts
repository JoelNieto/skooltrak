import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { School } from '../../schools/entities/school.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@ObjectType()
export class Course implements Prisma.CourseCreateInput {
  @Field(() => String, { description: 'ID of the course' })
  id: string;

  @Field(() => String, { description: 'Name of the course' })
  name: string;

  @Field(() => String, { description: 'Code of the course' })
  code: string;

  @Field(() => String, { description: 'Short name of the course' })
  shortName: string;

  @Field(() => Date, { description: 'Created at of the course' })
  createdAt?: string | Date;

  @Field(() => Date, { description: 'Updated at of the course' })
  updatedAt?: string | Date;

  @Field(() => School, { description: 'School of the course' })
  school: Prisma.SchoolCreateNestedOneWithoutCoursesInput;

  @Field(() => Subject, { description: 'Subject of the course' })
  subject: Prisma.SubjectCreateNestedOneWithoutCoursesInput;

  @Field(() => StudyPlan, { description: 'Study plan of the course' })
  studyPlan: Prisma.StudyPlanCreateNestedOneWithoutCoursesInput;
}
