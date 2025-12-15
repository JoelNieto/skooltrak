import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
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
