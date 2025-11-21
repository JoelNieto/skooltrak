import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateCourseInput implements Prisma.CourseUncheckedCreateInput {
  @Field(() => String, { description: 'Name of the course', nullable: true })
  name: string;

  @Field(() => String, { description: 'Code of the course' })
  code: string;

  @Field(() => String, {
    description: 'Short name of the course',
    nullable: true,
  })
  shortName: string;

  @Field(() => String, { description: 'Organization ID of the course' })
  organizationId: string;

  @Field(() => String, { description: 'School ID of the course' })
  schoolId: string;

  @Field(() => String, { description: 'Subject ID of the course' })
  subjectId: string;

  @Field(() => String, { description: 'Study plan ID of the course' })
  studyPlanId: string;

  @Field(() => String, {
    description: 'Teacher ID of the course',
    nullable: true,
  })
  teacherId?: string;

  @Field(() => String, {
    description: 'Current period ID of the course',
    nullable: true,
  })
  currentPeriodId?: string;
}
