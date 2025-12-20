import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradesModule } from '../grades/grades.module';
import { StudentsResolver } from './students.resolver';
import { StudentsService } from './students.service';

@Module({
  providers: [StudentsResolver, StudentsService],
  imports: [PrismaModule, GradesModule],
})
export class StudentsModule {}
