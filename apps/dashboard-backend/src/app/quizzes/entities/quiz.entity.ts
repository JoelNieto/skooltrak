import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { QuizQuestion } from './quiz-question.entity';
@ObjectType()
export class Quiz
  implements
    Prisma.QuizGetPayload<{
      include: {
        course: true;
        teacher: true;
        questions: true;
      };
    }>
{
  @Field(() => String, { description: 'ID' })
  id: string;

  @Field(() => String, { description: 'Title' })
  title: string;

  @Field(() => String, { description: 'Details' })
  details: string;

  @Field(() => String, { description: 'Organization ID' })
  organizationId: string;

  @Field(() => String, { description: 'Course ID' })
  courseId: string;

  @Field(() => String, { description: 'Teacher ID' })
  teacherId: string;

  @Field(() => Date, { description: 'Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated At' })
  updatedAt: Date;

  @Field(() => Course, { description: 'Course' })
  course: Course;

  @Field(() => Teacher, { description: 'Teacher' })
  teacher: Teacher;

  @Field(() => [QuizQuestion], { description: 'Questions' })
  questions: QuizQuestion[];
}
