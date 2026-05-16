import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { GradesModule } from '../grades/grades.module';
import { PrismaModule } from '../prisma.module';
import { StudentsController } from './students.controller';
import { StudentsResolver } from './students.resolver';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [StudentsResolver] : []),
    StudentsService,
  ],
  imports: [PrismaModule, GradesModule, ChatsModule],
})
export class StudentsModule {}
