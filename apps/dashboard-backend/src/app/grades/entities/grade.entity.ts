import { Prisma } from '@generated/prisma';
import { Course } from '../../courses/entities/course.entity';
import { GradeBucket } from '../../grade-buckets/entities/grade-bucket.entity';
import { StudentGrade } from '../../student-grades/entities/student-grade.entity';
import { Period } from '../../periods/entities/period.entity';
export class Grade
  implements
    Prisma.GradeGetPayload<{
      include: {
        period: true;
        bucket: true;
        course: true;
        studentGrades: true;
      };
    }>
{
    id: string;
    title: string;
    comments: string | null;
    courseId: string;
    bucketId: string;
    periodId: string;
    date: Date;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;

    period: Period;

    bucket: GradeBucket;

    course: Course;

    studentGrades: StudentGrade[];
}
