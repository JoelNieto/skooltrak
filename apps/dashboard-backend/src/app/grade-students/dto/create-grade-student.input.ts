import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { DecimalJsLike } from '@prisma/client/runtime/library';

@InputType()
export class CreateGradeStudentInput
  implements Prisma.GradeStudentUncheckedCreateInput
{
  @Field(() => String, { description: 'Comments for the grade student' })
  comments?: string;

  @Field(() => String, { description: 'Grade ID for the grade student' })
  gradeId: string;

  @Field(() => String, { description: 'Student ID for the grade student' })
  studentId: string;

  @Field(() => Number, { description: 'Score for the grade student' })
  score: number | Prisma.Decimal | DecimalJsLike;
}
