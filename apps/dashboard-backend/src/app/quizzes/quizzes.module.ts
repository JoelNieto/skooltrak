import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesResolver } from './quizzes.resolver';
import { QuizzesService } from './quizzes.service';

@Module({
  controllers: [QuizzesController],
  providers: [
    ...(includeNestGraphQlResolvers ? [QuizzesResolver] : []),
    QuizzesService,
  ],
  imports: [PrismaModule],
})
export class QuizzesModule {}
