import { Field, InputType } from '@nestjs/graphql';
import { $Enums, Prisma } from '@prisma/client';
import { DecimalJsLike } from '@prisma/client/runtime/library';

@InputType()
export class CreateQuizInput {
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

  @Field(() => [CreateQuizQuestionInput], { description: 'Questions' })
  questions?: CreateQuizQuestionInput[];
}

@InputType()
export class CreateQuizQuestionInput {
  @Field(() => String, { description: 'Question' })
  question: string;

  @Field(() => String, { description: 'Value' })
  value: string | number | Prisma.Decimal | DecimalJsLike;

  @Field(() => String, { description: 'Type' })
  type: $Enums.QuizQuestionType;

  @Field(() => Number, { description: 'Time Limit', defaultValue: 0 })
  timeLimit?: number;

  @Field(() => [CreateQuizQuestionOptionInput], { description: 'Options' })
  options?: CreateQuizQuestionOptionInput[];
}

@InputType()
export class CreateQuizQuestionOptionInput
  implements Prisma.QuizQuestionOptionUncheckedCreateWithoutQuestionInput
{
  @Field(() => String, { description: 'Option' })
  option: string;

  @Field(() => Boolean, { description: 'Is Correct' })
  isCorrect: boolean;
}
