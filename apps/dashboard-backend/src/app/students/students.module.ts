import { AuthModule } from '@/auth';
import { Module } from '@nestjs/common';
import { GradesModule } from '../grades/grades.module';
import { PrismaModule } from '../prisma.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController],
  providers: [
    StudentsService,
  ],
  imports: [PrismaModule, GradesModule, AuthModule],
})
export class StudentsModule {}
