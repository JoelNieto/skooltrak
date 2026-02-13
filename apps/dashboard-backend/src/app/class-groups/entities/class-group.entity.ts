import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { Course } from '../../courses/entities/course.entity';
import { Student } from '../../students/entities/student.entity';
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
  @Field(() => String, { description: 'Organization ID of the class group' })
  organizationId: string;
  @Field(() => String, { description: 'School ID of the class group' })
  schoolId: string;
  @Field(() => Boolean, { description: 'Active status of the class group' })
  active: boolean;
  @Field(() => String, {
    description: 'Teacher ID of the class group',
    nullable: true,
  })
  teacherId: string;
  @Field(() => String, { description: 'Study plan ID of the class group' })
  studyPlanId: string;
  @Field(() => Teacher, {
    description: 'Teacher of the class group',
    nullable: true,
  })
  teacher: Teacher;
  @Field(() => StudyPlan, { description: 'Study plan of the class group' })
  studyPlan: StudyPlan;
  @Field(() => [Student], { description: 'Students of the class group' })
  students: Student[];
  @Field(() => [Course], { description: 'Courses of the class group' })
  courses: Course[];
  @Field(() => Date, { description: 'Created at of the class group' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at of the class group' })
  updatedAt: Date;
}
