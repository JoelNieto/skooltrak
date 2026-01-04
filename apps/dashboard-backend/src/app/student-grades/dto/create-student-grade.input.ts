import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateStudentGradeInput
  implements Prisma.StudentGradeUncheckedCreateInput
{
  @Field(() => String, { description: 'Comments for the student grade' })
  comments?: string;

  @Field(() => String, { description: 'Grade ID for the student grade' })
  gradeId: string;

  @Field(() => String, { description: 'Student ID for the student grade' })
  studentId: string;

  @Field(() => Number, { description: 'Score for the student grade' })
  score: number | Prisma.Decimal;
}
