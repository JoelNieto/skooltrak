import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { SubjectsController } from './subjects.controller';
import { SubjectsResolver } from './subjects.resolver';
import { SubjectsService } from './subjects.service';

@Module({
  controllers: [SubjectsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [SubjectsResolver] : []),
    SubjectsService,
  ],
  imports: [PrismaModule],
})
export class SubjectsModule {}
