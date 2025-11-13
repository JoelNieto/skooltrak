import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateQuizInput } from './dto/create-quiz.input';
import { UpdateQuizInput } from './dto/update-quiz.input';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}
  create(createQuizInput: CreateQuizInput) {
    const {
      organizationId,
      courseId,
      teacherId,
      questions = [],
      ...rest
    } = createQuizInput;

    const data = {
      ...rest,
      organization: { connect: { id: organizationId } },
      course: { connect: { id: courseId } },
      teacher: { connect: { id: teacherId } },
      questions: {
        create: questions.map((question) => ({
          question: question.question,
          value: question.value as any,
          type: question.type,
          timeLimit: question.timeLimit,
          options: {
            create: (question.options ?? []).map((option) => ({
              option: option.option,
              isCorrect: option.isCorrect,
            })),
          },
        })),
      },
    };
    return this.prisma.quiz.create({ data });
  }

  findAll(organizationId: string) {
    return this.prisma.quiz.findMany({ where: { organizationId } });
  }

  findOne(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } },
    });
  }

  update(id: string, updateQuizInput: UpdateQuizInput) {
    const { organizationId, courseId, teacherId, questions, ...rest } =
      updateQuizInput;

    const data: any = {
      ...rest,
    };

    if (organizationId) {
      data.organization = { connect: { id: organizationId } };
    }
    if (courseId) {
      data.course = { connect: { id: courseId } };
    }
    if (teacherId) {
      data.teacher = { connect: { id: teacherId } };
    }

    if (questions) {
      data.questions = {
        deleteMany: {},
        create: questions.map((question) => ({
          question: question.question,
          value: question.value as any,
          type: question.type,
          timeLimit: question.timeLimit,
          options: {
            create: (question.options ?? []).map((option) => ({
              option: option.option,
              isCorrect: option.isCorrect,
            })),
          },
        })),
      };
    }

    return this.prisma.quiz.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.quiz.delete({ where: { id } });
  }
}
