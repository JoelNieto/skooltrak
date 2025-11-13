import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class QuizQuestionOption
  implements
    Prisma.QuizQuestionOptionGetPayload<{
      include: undefined;
    }>
{
  @Field(() => String, { description: 'ID' })
  id: string;

  @Field(() => String, { description: 'Option' })
  option: string;

  @Field(() => String, { description: 'Question ID' })
  questionId: string;

  @Field(() => Boolean, { description: 'Is Correct' })
  isCorrect: boolean;
}
