import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { TeachersController } from './teachers.controller';
import { TeachersResolver } from './teachers.resolver';
import { TeachersService } from './teachers.service';

@Module({
  controllers: [TeachersController],
  providers: [
    ...(includeNestGraphQlResolvers ? [TeachersResolver] : []),
    TeachersService,
  ],
  imports: [PrismaModule],
})
export class TeachersModule {}
