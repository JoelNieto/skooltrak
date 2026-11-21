import { Module } from '@nestjs/common';
import { GradesModule } from '../grades/grades.module';
import { CLOCK, systemClock } from '../home/home-time';
import { PrismaModule } from '../prisma.module';
import { GradebookController } from './gradebook.controller';
import { GradebookService } from './gradebook.service';

/** Teacher gradebook (ASM-001). */
@Module({
  imports: [PrismaModule, GradesModule],
  controllers: [GradebookController],
  providers: [GradebookService, { provide: CLOCK, useValue: systemClock }],
})
export class GradebookModule {}
