import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CoursesController } from './courses.controller';
import { CLOCK, systemClock } from '../home/home-time';
import { CoursesMineService } from './courses-mine.service';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CoursesMineService, { provide: CLOCK, useValue: systemClock }],
  imports: [PrismaModule],
  exports: [CoursesService],
})
export class CoursesModule {}
