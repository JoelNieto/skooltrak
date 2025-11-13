import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateQuizInput } from './dto/create-quiz.input';
import { UpdateQuizInput } from './dto/update-quiz.input';
import { Quiz } from './entities/quiz.entity';
import { QuizzesService } from './quizzes.service';

@Resolver(() => Quiz)
export class QuizzesResolver {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Mutation(() => Quiz)
  createQuiz(@Args('createQuizInput') createQuizInput: CreateQuizInput) {
    return this.quizzesService.create(createQuizInput);
  }

  @Query(() => [Quiz], { name: 'quizzes' })
  findAll(
    @Args('organizationId', { type: () => String }) organizationId: string
  ) {
    return this.quizzesService.findAll(organizationId);
  }

  @Query(() => Quiz, { name: 'quiz' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.quizzesService.findOne(id);
  }

  @Mutation(() => Quiz)
  updateQuiz(@Args('updateQuizInput') updateQuizInput: UpdateQuizInput) {
    return this.quizzesService.update(updateQuizInput.id, updateQuizInput);
  }

  @Mutation(() => Quiz)
  removeQuiz(@Args('id', { type: () => String }) id: string) {
    return this.quizzesService.remove(id);
  }
}
