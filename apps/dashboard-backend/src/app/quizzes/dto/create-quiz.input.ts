import { $Enums, Prisma } from '@generated/prisma';
export class CreateQuizInput {
    title: string;

    details: string;

    organizationId: string;

    courseId: string;

    teacherId: string;

    questions?: CreateQuizQuestionInput[];
}

export class CreateQuizQuestionInput {
    question: string;

    value: string | number | Prisma.Decimal;

    type: $Enums.QuizQuestionType;

    timeLimit?: number;

    options?: CreateQuizQuestionOptionInput[];
}

export class CreateQuizQuestionOptionInput
  implements Prisma.QuizQuestionOptionUncheckedCreateWithoutQuestionInput
{
    option: string;

    isCorrect: boolean;
}
