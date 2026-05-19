import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [
    CoursesService,
  ],
  imports: [PrismaModule],
  exports: [CoursesService],
})
export class CoursesModule {}
