import { Field, ObjectType } from '@nestjs/graphql';
import { $Enums, Prisma } from '@prisma/client';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@ObjectType()
export class Assignment
  implements
    Prisma.AssignmentGetPayload<{ include: { teacher: true; course: true } }>
{
  @Field(() => String, { description: 'ID of the assignment (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'Title of the assignment' })
  title: string;
  @Field(() => String, { description: 'Details of the assignment' })
  details: string;
  @Field(() => String, { description: 'Type of the assignment' })
  type: $Enums.AssignmentType;
  @Field(() => Date, { description: 'Date of the assignment' })
  date: Date;
  @Field(() => String, { description: 'School ID of the assignment' })
  schoolId: string;
  @Field(() => String, { description: 'Course ID of the assignment' })
  courseId: string;
  @Field(() => Course, { description: 'Course of the assignment' })
  course: Course;
  @Field(() => Boolean, { description: 'Require submission of the assignment' })
  requireSubmission: boolean;
  @Field(() => String, { description: 'Teacher ID of the assignment' })
  teacherId: string;
  @Field(() => Teacher, { description: 'Teacher of the assignment' })
  teacher: Teacher;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
