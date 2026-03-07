import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { GradesModule } from '../grades/grades.module';
import { PrismaModule } from '../prisma.module';
import { StudentsResolver } from './students.resolver';
import { StudentsService } from './students.service';

@Module({
  providers: [StudentsResolver, StudentsService],
  imports: [PrismaModule, GradesModule, ChatsModule],
})
export class StudentsModule {}
