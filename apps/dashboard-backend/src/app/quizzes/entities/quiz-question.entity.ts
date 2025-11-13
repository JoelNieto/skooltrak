import { Field, ObjectType } from '@nestjs/graphql';
import { $Enums, Prisma } from '@prisma/client';
import { QuizQuestionOption } from './quiz-question-option.entity';

@ObjectType()
export class QuizQuestion
  implements
    Prisma.QuizQuestionGetPayload<{
      include: { options: true };
    }>
{
  @Field(() => String, { description: 'ID' })
  id: string;

  @Field(() => String, { description: 'Question' })
  question: string;

  @Field(() => String, { description: 'Quiz ID' })
  quizId: string;

  @Field(() => Number, { description: 'Value' })
  value: Prisma.Decimal;

  @Field(() => String, { description: 'Type' })
  type: $Enums.QuizQuestionType;

  @Field(() => Number, { description: 'Time Limit', defaultValue: 0 })
  timeLimit: number;

  @Field(() => [QuizQuestionOption], { description: 'Options' })
  options: QuizQuestionOption[];
}
