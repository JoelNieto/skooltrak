import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { Grade } from '../../grades/entities/grade.entity';
import { Student } from '../../students/entities/student.entity';
@ObjectType()
export class StudentGrade
  implements
    Prisma.StudentGradeGetPayload<{ include: { student: true; grade: true } }>
{
  @Field(() => String, { description: 'ID of the student grade' })
  id: string;
  @Field(() => Student, { description: 'Student of the student grade' })
  student: Student;
  @Field(() => Grade, { description: 'Grade of the student grade' })
  grade: Grade;
  @Field(() => String, {
    description: 'Comments for the student grade',
    nullable: true,
  })
  comments: string;
  @Field(() => String, { description: 'Grade ID of the student grade' })
  gradeId: string;
  @Field(() => String, { description: 'Student ID of the student grade' })
  studentId: string;
  @Field(() => Number, {
    description: 'Score of the student grade',
    nullable: true,
  })
  score: Prisma.Decimal;
  @Field(() => Date, { description: 'Created at of the student grade' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at of the student grade' })
  updatedAt: Date;
}
