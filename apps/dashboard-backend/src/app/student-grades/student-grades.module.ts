import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudentGradesResolver } from './student-grades.resolver';
import { StudentGradesService } from './student-grades.service';

@Module({
  providers: [StudentGradesResolver, StudentGradesService],
  imports: [PrismaModule],
})
export class StudentGradesModule {}
