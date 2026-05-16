import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CoursesController } from './courses.controller';
import { CoursesResolver } from './courses.resolver';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [
    ...(includeNestGraphQlResolvers ? [CoursesResolver] : []),
    CoursesService,
  ],
  imports: [PrismaModule],
  exports: [CoursesService],
})
export class CoursesModule {}
