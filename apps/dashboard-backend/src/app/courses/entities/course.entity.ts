import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { School } from '../../schools/entities/school.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@ObjectType()
export class Course
  implements
    Prisma.CourseGetPayload<{
      include: { school: true; subject: true; studyPlan: true };
    }>
{
  @Field(() => String, { description: 'ID of the course (auto-generated)' })
  id: string;
  @Field(() => School, { description: 'School of the course' })
  school: School;
  @Field(() => Subject, { description: 'Subject of the course' })
  subject: Subject;
  @Field(() => StudyPlan, { description: 'Study plan of the course' })
  studyPlan: StudyPlan;
  @Field(() => String, { description: 'Name of the course' })
  name: string;
  @Field(() => String, { description: 'Code of the course' })
  code: string;
  @Field(() => String, { description: 'Short name of the course' })
  shortName: string;
  @Field(() => String, { description: 'Organization ID of the course' })
  organizationId: string;
  @Field(() => String, { description: 'School ID of the course' })
  schoolId: string;
  @Field(() => String, { description: 'Subject ID of the course' })
  subjectId: string;
  @Field(() => String, { description: 'Study plan ID of the course' })
  studyPlanId: string;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
  @Field(() => String, { description: 'Teacher ID of the course' })
  teacherId: string;
  @Field(() => Teacher, {
    description: 'Teacher of the course',
    nullable: true,
  })
  teacher: Teacher;
}
