import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudentGradesController } from './student-grades.controller';
import { StudentGradesService } from './student-grades.service';

@Module({
  controllers: [StudentGradesController],
  providers: [
    StudentGradesService,
  ],
  imports: [PrismaModule],
})
export class StudentGradesModule {}
