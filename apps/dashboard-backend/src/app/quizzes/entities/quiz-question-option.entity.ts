import { Prisma } from '@generated/prisma';
export class QuizQuestionOption
  implements
    Prisma.QuizQuestionOptionGetPayload<{
      include: undefined;
    }>
{
    id: string;

    option: string;

    questionId: string;

    isCorrect: boolean;
}
