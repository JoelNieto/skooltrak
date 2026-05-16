import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudentGradesController } from './student-grades.controller';
import { StudentGradesResolver } from './student-grades.resolver';
import { StudentGradesService } from './student-grades.service';

@Module({
  controllers: [StudentGradesController],
  providers: [
    ...(includeNestGraphQlResolvers ? [StudentGradesResolver] : []),
    StudentGradesService,
  ],
  imports: [PrismaModule],
})
export class StudentGradesModule {}
