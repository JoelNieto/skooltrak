import { $Enums, Prisma } from '@generated/prisma';
import { QuizQuestionOption } from './quiz-question-option.entity';

export class QuizQuestion
  implements
    Prisma.QuizQuestionGetPayload<{
      include: { options: true };
    }>
{
    id: string;

    question: string;

    quizId: string;

    value: Prisma.Decimal;

    type: $Enums.QuizQuestionType;

    timeLimit: number;

    options: QuizQuestionOption[];
}
