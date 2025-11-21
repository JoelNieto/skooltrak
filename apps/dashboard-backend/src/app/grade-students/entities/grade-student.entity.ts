import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Grade } from '../../grades/entities/grade.entity';
import { Student } from '../../students/entities/student.entity';

@ObjectType()
export class GradeStudent
  implements
    Prisma.GradeStudentGetPayload<{ include: { student: true; grade: true } }>
{
  @Field(() => String, { description: 'ID of the grade student' })
  id: string;
  @Field(() => Student, { description: 'Student of the grade student' })
  student: Student;
  @Field(() => Grade, { description: 'Grade of the grade student' })
  grade: Grade;
  @Field(() => String, {
    description: 'Comments for the grade student',
    nullable: true,
  })
  comments: string;
  @Field(() => String, { description: 'Grade ID of the grade student' })
  gradeId: string;
  @Field(() => String, { description: 'Student ID of the grade student' })
  studentId: string;
  @Field(() => Number, {
    description: 'Score of the grade student',
    nullable: true,
  })
  score: Prisma.Decimal;
  @Field(() => Date, { description: 'Created at of the grade student' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at of the grade student' })
  updatedAt: Date;
}
