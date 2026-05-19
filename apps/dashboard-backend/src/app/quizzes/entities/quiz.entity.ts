import { Prisma } from '@generated/prisma';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { QuizQuestion } from './quiz-question.entity';
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
    id: string;

    title: string;

    details: string;

    organizationId: string;

    courseId: string;

    teacherId: string;

    createdAt: Date;

    updatedAt: Date;

    course: Course;

    teacher: Teacher;

    questions: QuizQuestion[];
}
