import { AuthModule } from '@/auth';
import { Module } from '@nestjs/common';
import { FinancialModule } from '../financial/financial.module';
import { GradesModule } from '../grades/grades.module';
import { PrismaModule } from '../prisma.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController],
  providers: [
    StudentsService,
  ],
  imports: [PrismaModule, GradesModule, AuthModule, FinancialModule],
})
export class StudentsModule {}
