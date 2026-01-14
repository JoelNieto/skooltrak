import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CoursesResolver } from './courses.resolver';
import { CoursesService } from './courses.service';

@Module({
  providers: [CoursesResolver, CoursesService],
  imports: [PrismaModule],
  exports: [CoursesService],
})
export class CoursesModule {}
