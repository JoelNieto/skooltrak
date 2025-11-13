import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { QuizzesResolver } from './quizzes.resolver';
import { QuizzesService } from './quizzes.service';

@Module({
  providers: [QuizzesResolver, QuizzesService],
  imports: [PrismaModule],
})
export class QuizzesModule {}
