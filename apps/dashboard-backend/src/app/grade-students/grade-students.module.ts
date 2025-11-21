import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradeStudentsResolver } from './grade-students.resolver';
import { GradeStudentsService } from './grade-students.service';

@Module({
  providers: [GradeStudentsResolver, GradeStudentsService],
  imports: [PrismaModule],
})
export class GradeStudentsModule {}
