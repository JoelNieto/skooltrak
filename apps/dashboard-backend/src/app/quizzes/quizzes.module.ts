import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  controllers: [QuizzesController],
  providers: [
    QuizzesService,
  ],
  imports: [PrismaModule],
})
export class QuizzesModule {}
